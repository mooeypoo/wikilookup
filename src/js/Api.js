( function ( $ ) {
	/**
	 * API class to fetch page information from the API, either by mediawiki api or restbase
	 *
	 * @class Wikilookup.Api
	 *
	 * @constructor
	 * @param {Object} [config] Configuration options
	 * @param {string} [config.lang='en'] Language parameter, for dynamic base URLs `{{lang}}` variable
	 * @param {string} [config.useRestbase=false] Use the restbase structure and expected response from the API.
	 *  Default value (false) means the expected API response and sent parameters conform to MediaWiki's internal
	 *  API behavior.
	 * @param {string} [config.baseURL] A set base url for the API endpoint. Can include two parameters that
	 *  will be substituted:
	 *  - `{{lang}}` Chosen language, in case the domain has variants, like `https://{{lang}}.wikipedia.org`
	 *  - `{{pageName}}` Requested page name will be placed in that URL entrypoint. This is mostly relevant
	 *    for restbase, which adds the page name parameter at the end of the request URL
	 */
	var Api = function ( config ) {
		config = config || {};

		this.cache = {};
		this.promises = {};
		this.standardURLs = {
			restBase: 'https://{{lang}}.wikipedia.org/api/rest_v1/page/summary/{{pageName}}',
			api: 'https://{{lang}}.wikipedia.org/w/api.php'
		};

		// Configuration options
		this.lang = config.lang || 'en';
		this.useRestbase = !!config.useRestbase;
		this.baseURL = config.baseURL;
		this.logo = $.extend( {
			url: '',
			title: ''
		}, config.logo );

		if ( !this.baseURL ) {
			this.baseURL = this.useRestbase ?
				this.standardURLs.restBase :
				this.standardURLs.api;
		}

		this.isWikipedia = !!this.baseURL.match( /https:\/\/(.+)\.wikipedia\.org/ );
	};

	/**
	 * Get the info for the requested page
	 *
	 * @param {string} pageName Requested page
	 * @param {string} [lang] Optional language override
	 * @return {Object} Page data
	 */
	Api.prototype.getPageInfo = function ( pageName, lang ) {
		var self = this,
			key = this.getCacheKey( pageName, lang );

		if ( this.cache[ key ] ) {
			return $.Deferred().resolve( this.cache[ key ] );
		}

		if ( this.promises[ key ] ) {
			// If this exists, the promise is already ongoing
			return this.promises[ key ];
		}

		return this.fetch( pageName, lang )
			.then( function ( result ) {
				self.updateCache( pageName, result );
				return result;
			} );
	};

	/**
	 * Fetch information from the API
	 *
	 * @private
	 * @param {string} pageName Page name
	 * @param {string} [lang] Optional language override
	 * @return {jQuery.Promise} Promise that is resolved when the data
	 *  is available from the API, or is rejected if there was any
	 *  problem fetching the data.
	 */
	Api.prototype.fetch = function ( pageName, lang ) {
		var promise,
			self = this,
			key = this.getCacheKey( pageName, lang );

		promise = $.ajax( this.getApiParams( pageName, lang ) )
			.then(
				// Success
				function ( result ) {
					self.promises[ key ] = null;
					return self.processApiResult( result );
				},
				// Failure
				function () {
					self.promises[ key ] = null;
					return 'error';
				}
			)
			.then( function ( result ) {
				self.promises[ key ] = null;

				if ( result === 'error' || result === 'missing' ) {
					return $.Deferred().reject( result );
				}

				return result;
			} );

		this.promises[ key ] = promise;

		return promise;
	};

	/**
	 * Process the response we get from the API, either restbase or
	 * plain MediaWiki api.
	 *
	 * @param  {Object} apiResult API result
	 * @return {Object} Page details
	 */
	Api.prototype.processApiResult = function ( apiResult ) {
		var data, pages;

		if ( !apiResult ) {
			return 'error';
		}

		if ( this.useRestbase ) {
			if ( apiResult.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found' ) {
				// Missing page
				return 'missing';
			}
			return {
				title: apiResult.displaytitle,
				content: apiResult.extract,
				thumbnail: apiResult.thumbnail || {},
				url: apiResult.content_urls.desktop.page,
				history: apiResult.content_urls.desktop.revisions,
				dir: apiResult.dir || 'ltr',
				wikipedia: this.isWikipedia,
				source: {
					logo: this.logo.url,
					title: this.logo.title
				}
			};
		}

		// Use the base mediawiki API
		pages = Wikilookup.tools.getPropValue( apiResult, [ 'query', 'pages' ] );
		data = pages[ Object.keys( pages )[ 0 ] ];

		if ( !data ) {
			return 'error';
		}

		if ( data.missing !== undefined ) {
			return 'missing';
		}

		return {
			title: data.title,
			content: data.extract,
			thumbnail: data.thumbnail,
			url: data.canonicalurl,
			history: data.fullurl + '?action=history',
			dir: data.pagelanguagedir || 'ltr',
			wikipedia: this.isWikipedia,
			source: {
				logo: this.logo.url,
				title: this.logo.title
			}
		};
	};

	/**
	 * Update or insert a cache value
	 *
	 * @param  {string} pageName Page name
	 * @param  {Object} data Page data
	 */
	Api.prototype.updateCache = function ( pageName, data ) {
		this.cache[ this.getCacheKey( pageName ) ] = data;
	};

	/**
	 * Create a cache key from the given page name.
	 * We normalize the page name so that we can make sure
	 * we cache no matter what case or language it was given.
	 *
	 * @param {string} pageName
	 * @param {string} [lang]
	 * @return {string} Cache key
	 */
	Api.prototype.getCacheKey = function ( pageName, lang ) {
		lang = lang || this.lang;
		return lang + '|' + pageName
			.trim()
			.toLowerCase()
			.replace( new RegExp( /\s/g ), '_' );
	};

	/**
	 * Get an API url based on the base URL, pagename and language
	 * if those are given as parameters in the base URL.
	 *
	 * @param {string} pageName Requested page name
	 * @param {string} [lang] An optional language override
	 * @return {string} URL to the API endpoint
	 */
	Api.prototype.getApiUrl = function ( pageName, lang ) {
		return this.baseURL
			.replace(
				'{{lang}}', encodeURIComponent( lang || this.lang )
			)
			.replace(
				'{{pageName}}', encodeURIComponent( pageName )
			);
	};

	/**
	 * Get the object definition for the ajax call,
	 * including the full URL endpoint, data, and
	 * ajax options.
	 *
	 * @param {string} pageName Requested page name
	 * @param {string} [lang] An optional language override
	 * @return {Object} Ajax definition object
	 */
	Api.prototype.getApiParams = function ( pageName, lang ) {
		var apiURL = this.getApiUrl( pageName, lang );

		if ( this.useRestbase ) {
			return {
				url: apiURL,
				data: { redirect: true }
			};
		}

		// Use php API
		return {
			url: apiURL,
			dataType: 'jsonp',
			data: {
				action: 'query',
				format: 'json',
				prop: 'info|pageimages|extracts',
				titles: pageName,
				inprop: 'url',
				piprop: 'thumbnail',
				pithumbsize: 300,
				redirects: '1',
				exsentences: 5,
				// explaintext: '1',
				exintro: '1'
			}
		};
	};

	// Export to namespace
	Wikilookup.Api = Api;
}( jQuery ) );
