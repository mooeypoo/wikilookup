/* >> Starting source: src/js/namespace.js << */
( function ( $ ) {
	if ( !$.wikilookup ) {
		$.wikilookup = {};
	}
}( jQuery ) );
/* >> End source: src/js/namespace.js << */
/* >> Starting source: src/js/tools.js << */

	$.wikilookup.tools = {
		/**
		 * Get the value of a nested property in an object,
		 * if it exists, safely. If, at any point, the chain
		 * breaks, the method safely stops and returns undefined.
		 *
		 * @param  {Object} obj Object to fetch the property from
		 * @param  {string[]} props An array of nested properties
		 * @return {Mixed} Value of the nested property chain
		 */
		getPropValue: function ( obj, props ) {
			var val = obj || {},
				counter = 0;

			do {
				val = val[ props[ counter ] ];
				counter++;
			} while ( val && counter < props.length );

			return val;
		}
	};
/* >> End source: src/js/tools.js << */
/* >> Starting source: src/js/Api.js << */

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
		var key = this.getCacheKey( pageName );

		if ( this.cache[ key ] ) {
			return $.Deferred().resolve( this.cache[ key ] );
		}

		return this.fetch( pageName )
			.then( this.updateCache.bind( this, pageName ) );
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
		return $.ajax( this.getApiParams( pageName ) )
			.then(
				this.processApiResult.bind( this ),
				// Failure
				function () {
					return 'error';
				}
			)
			.then( function ( result ) {
				if ( result === 'error' ) {
					return $.Deferred().reject( 'error' );
				}
			} );
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
				thumbnail: apiResult.thumbnail,
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
/* >> End source: src/js/Api.js << */
/* >> Starting source: src/js/PageInfoWidget.js << */

	/**
	 * [description]
	 *
	 * @param {Object} config Configuration options
	 * @param {Object} [messages] Text for the display states
	 *  - messages.pending: Text or jQuery node that appears when the widget
	 *    is in a pending state.
	 *  - messages.error: Text or jQuery node that appears when the widget
	 *    is in an error mode.
	 *  - messages.link: The text that appears for the 'read more' link that
	 *    links back to the page's origins
	 */
	var PageInfoWidget = function ( config ) {
		config = config || {};

		this.$element = config.$element || $( '<div>' );

		this.messages = $.extend( {}, {
			link: 'Read more',
			pending: '',
			error: 'There was a problem loading this page information.'
		}, config.messags );

		this.$pending = this.buildPending();
		this.$view = this.buildView();
		this.$error = this.buildError();

		// Initialize
		this.setState( 'pending' );
		this.$element
			.addClass( 'wl-pageInfoWidget' )
			.append(
				this.$pending,
				this.$error,
				this.$view
			);
	};

	/**
	 * Set the widget state between the available states:
	 * pending, ready, and error
	 *
	 * @param {string} state Widget state
	 */
	PageInfoWidget.prototype.setState = function ( state ) {
		var legalStates = [ 'pending', 'ready', 'error' ];

		if ( this.state !== state && legalStates.indexOf( state ) > -1 ) {
			legalStates.forEach( function ( opt ) {
				this.$element.toggleClass( 'wl-pageInfoWidget-state-' + opt, state === opt );
			}.bind( this ) );
			this.state = state;
		}
	};

	/**
	 * Get the current widget state
	 *
	 * @return {string} Widget state
	 */
	PageInfoWidget.prototype.getState = function () {
		return this.state;
	};

	/**
	 * Build the DOM elements that contain the data view
	 *
	 * @private
	 * @return {jQuery} Info view
	 */
	PageInfoWidget.prototype.buildView = function () {
		this.$title = $( '<h1>' ).addClass( 'wl-pageInfoWidget-view-title' );
		this.$content = $( '<div>' ).addClass( 'wl-pageInfoWidget-view-content' );
		this.$thumb = $( '<div>' ).addClass( 'wl-pageInfoWidget-view-thumb' );
		this.$link = $( '<a>' )
			.addClass( 'wl-pageInfoWidget-view-link' )
			.append( this.messages.link );

		// Build the widget
		// TODO: Allow giving the widget a previously built
		// structure or template to use
		return $( '<div>' )
			.append(
				this.$title,
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-box' )
					.append( this.$content, this.$link ),
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-box' )
					.append( this.$thumb )
			).contents();
	};

	/**
	 * Fill in the information with the data given
	 *
	 * @param  {Object} data Page data
	 */
	PageInfoWidget.prototype.setData = function ( data ) {
		this.$title.text( data.title );
		this.$content.text( data.content );
		this.$thumb.css( {
			backgroundImage: 'url( ' + data.source + ' )',
			width: data.width,
			height: '100%',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			backgroundPosition: 'center'
		} );
		this.$link.attr( 'href', data.url );
	};

	/**
	 * Build the pending view for the widget
	 *
	 * @private
	 * @return {jQuery} Pending view
	 */
	PageInfoWidget.prototype.buildPending = function () {
		// TODO: Allow giving the widget a previously built
		// structure or template to use
		return $( '<div>' )
			.append( this.messages.pending );
	};

	/**
	 * Build the error view for the widget
	 *
	 * @private
	 * @return {jQuery} Error view
	 */
	PageInfoWidget.prototype.buildError = function () {
		// TODO: Allow giving the widget a previously built
		// structure or template to use
		return $( '<div>' )
			.append( this.messages.error );
	};

	// Export to namespace
	$.wikilookup.PageInfoWidget = PageInfoWidget;
/* >> End source: src/js/PageInfoWidget.js << */