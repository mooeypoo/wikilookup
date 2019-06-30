( function () {
	/**
	 * API class to fetch page information from the API, either by mediawiki api or restbase
	 *
	 * @class $.wikilookup.Api
	 *
	 * @constructor
	 * @param {Object} [config] Configuration options
	 * @param {string} [config.lang] Language parameter, for dynamic base URLs {{lang}} variable
	 * @param {string} [config.useRestbase] Use the restbase structure and expected response from the API.
	 *  Default value (false) means the expected API response and sent parameters conform to MediaWiki's internal
	 *  API behavior.
	 * @param {string} [config.baseURL] A set base url for the API endpoint. Can include two parameters that
	 *  will be used:
	 *  - '{{lang}}' Chosen language, in case the domain has variants, like https://{{lang}}.wikipedia.org
	 *  - '{{pageName}}' Requested page name will be placed in that URL entrypoint. This is mostly relevant
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

		if ( !this.baseURL ) {
			this.baseURL = this.useRestbase ?
				this.standardURLs.restBase :
				this.standardURLs.api;
		}
	};

	/**
	 * Get the info for the requested page
	 *
	 * @param  {string} pageName Requested page
	 * @return {Object} Page data
	 */
	Api.prototype.getPageInfo = function ( pageName ) {
		var self = this,
			key = this.getCacheKey( pageName );

		if ( this.cache[ key ] ) {
			return $.Deferred().resolve( this.cache[ key ] );
		}

		if ( this.promises[ key ] ) {
			// If this exists, the promise is already ongoing
			return this.promises[ key ];
		}

		return this.fetch( pageName )
			.then( function ( result ) {
				self.updateCache( pageName, result );
				return result;
			} );
	};

	/**
	 * Fetch information from the API
	 *
	 * @private
	 * @param  {string} pageName Page name
	 * @return {jQuery.Promise} Promise that is resolved when the data
	 *  is available from the API, or is rejected if there was any
	 *  problem fetching the data.
	 */
	Api.prototype.fetch = function ( pageName ) {
		var promise,
			self = this,
			key = this.getCacheKey( pageName );

		promise = $.ajax( this.getApiParams( pageName ) )
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

				if ( result === 'error' ) {
					return $.Deferred().reject( 'error' );
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
				url: apiResult.content_urls.desktop.page
			};
		}

		// Use the base mediawiki API
		pages = $.wikilookup.tools.getPropValue( apiResult, [ 'query', 'pages' ] );
		data = pages[ Object.keys( pages )[ 0 ] ];

		if ( !data ) {
			return 'error';
		}

		return {
			title: data.title,
			content: data.extract,
			thumbnail: data.thumbnail,
			url: data.canonicalurl
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
	 * @param  {string} pageName
	 * @return {string} Cache key
	 */
	Api.prototype.getCacheKey = function ( pageName ) {
		return pageName
			.trim()
			.toLowerCase()
			.replace( new RegExp( /\s/g ), '_' );
	};

	/**
	 * Get the object definition for the ajax call,
	 * including the full URL endpoint, data, and
	 * ajax options.
	 *
	 * @param  {string} pageName Requested page name
	 * @return {Object} Ajax definition object
	 */
	Api.prototype.getApiParams = function ( pageName ) {
		var apiURL = this.baseURL;

		apiURL = apiURL
			.replace(
				'{{lang}}', encodeURIComponent( this.lang )
			)
			.replace(
				'{{pageName}}', encodeURIComponent( pageName )
			);

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
				explaintext: '1',
				exintro: '1'
			}
		};
	};

	// Export to namespace
	$.wikilookup.Api = Api;
}() );
