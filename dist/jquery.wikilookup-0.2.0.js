( function ( $ ) {
	if ( !$.wikilookup ) {
		$.wikilookup = {};
	}
}( jQuery ) );

( function ( $ ) {
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
}( jQuery ) );

( function ( $ ) {
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
		this.logo = $.extend( {
			url: '',
			title: ''
		}, config.logo );

		if ( !this.baseURL ) {
			this.baseURL = this.useRestbase ?
				this.standardURLs.restBase :
				this.standardURLs.api;
		}

		this.isWikipedia = !!this.baseURL.match( /https:\/\/(.+)\.wikipedia.org/ );
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
		pages = $.wikilookup.tools.getPropValue( apiResult, [ 'query', 'pages' ] );
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
	$.wikilookup.Api = Api;
}( jQuery ) );

( function ( $ ) {
	/**
	 * Page info widget
	 *
	 * @class $.wikilookup.PageInfoWidget
	 *
	 * @constructor
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
			link: 'Learn more',
			pending: 'Loading...',
			articleHistory: 'Revision history',
			error: 'There was a problem loading this page information.',
			wikimediaParticipate: 'Participate'
		}, config.messages );

		this.$pending = this.buildPending();
		this.$view = this.buildView();
		this.$error = this.buildError();
		this.$creditBar = this.buildCredidBar();

		// Initialize
		this.setState( 'pending' );
		this.$element
			.addClass( 'wl-pageInfoWidget' )
			.append(
				this.$pending,
				this.$error,
				this.$view,
				this.$creditBar
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

	PageInfoWidget.prototype.buildCredidBar = function () {
		this.$wikimediaSupport = $( '<a>' )
			.attr( 'target', '_blank' )
			.attr( 'href', 'https://wikimediafoundation.org/support/' )
			.text( 'Support MediaWiki' );
		return $( '<div>' )
			.addClass( 'wl-pageInfoWidget-creditbar' )
			.append(
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-creditbar-actions' )
					.append(
						// $( '<div>' )
						// 	.addClass( 'wl-pageInfoWidget-creditbar-actions-participate' )
						// 	.append(
						// 		$( '<a>' )
						// 			.attr( 'target', '_blank' )
						// 			.attr( 'href', 'https://wikimediafoundation.org/participate/' )
						// 			.text( this.messages.wikimediaParticipate )
						// 	),
						$( '<div>' )
							.addClass( 'wl-pageInfoWidget-creditbar-actions-support' )
							.append(
								this.$wikimediaSupport
							)
					)
			);
	};

	/**
	 * Build the DOM elements that contain the data view
	 *
	 * @private
	 * @return {jQuery} Info view
	 */
	PageInfoWidget.prototype.buildView = function () {
		this.$logo = $( '<div>' ).addClass( 'wl-pageInfoWidget-view-logo' );
		this.$title = $( '<div>' ).addClass( 'wl-pageInfoWidget-view-title' );
		this.$content = $( '<div>' ).addClass( 'wl-pageInfoWidget-view-content' );
		this.$thumb = $( '<div>' )
			.addClass( 'wl-pageInfoWidget-view-thumb' )
			.append(
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-view-thumb-fader' )
			);
		this.$fader = $( '<div>' ).addClass( 'wl-pageInfoWidget-view-fader' );
		this.$link = $( '<a>' )
			.addClass( 'wl-pageInfoWidget-view-link' )
			.attr( 'target', '_blank' )
			.append( this.messages.link );
		this.$historyLink = $( '<a>' )
			.addClass( 'wl-pageInfoWidget-view-historyLink' )
			.attr( 'target', '_blank' )
			.append( this.messages.articleHistory );
		// Build the widget
		// TODO: Allow giving the widget a previously built
		// structure or template to use
		return $( '<div>' )
			.addClass( 'wl-pageInfoWidget-content-ready' )
			.append(
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-box' )
					.append(
						this.$logo,
						this.$title,
						this.$content,
						this.$link,
						this.$historyLink
					),
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-box' )
					.append( this.$thumb )
			);
	};

	/**
	 * Fill in the information with the data given
	 *
	 * @param  {Object} data Page data
	 */
	PageInfoWidget.prototype.setData = function ( data ) {
		data = $.extend( { thumbnail: {}, source: {} }, data );

		this.$title.text( data.title );
		this.$content.append( data.content, this.$fader );
		if ( data.thumbnail.source ) {
			this.$thumb.css( {
				backgroundImage: 'url( ' + data.thumbnail.source + ' )',
				width: data.thumbnail.width,
				height: '100%',
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'cover',
				backgroundPosition: 'center'
			} );
			this.$creditBar.css( { width: data.thumbnail.width } );
		}
		this.$thumb.toggle( !!data.thumbnail.source );
		this.$element.attr( 'dir', data.dir || 'ltr' );
		this.$link.attr( 'href', data.url );
		this.$historyLink.attr( 'href', data.history );

		this.$element
			.toggleClass( 'wl-pageInfoWidget-wikipedia', !!data.wikipedia )
			.toggleClass( 'wl-pageInfoWidget-externalwiki', !data.wikipedia )
			.toggleClass( 'wl-pageInfoWidget-customlogo', data.source.logo )
			.toggleClass( 'wl-pageInfoWidget-noimage', !data.thumbnail.source );

		this.$wikimediaSupport.text(
			data.wikipedia ? 'Support Wikipedia' : 'Support MediaWiki'
		);

		this.$logo.empty();
		if ( !data.wikipedia && data.source.logo ) {
			this.$logo.append(
				$( '<img>' )
					.attr( 'src', data.source.logo )
					.attr( 'title', data.source.title )
			);
		}
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
			.addClass( 'wl-pageInfoWidget-content-pending' )
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
			.addClass( 'wl-pageInfoWidget-content-error' )
			.append( this.messages.error );
	};

	// Export to namespace
	$.wikilookup.PageInfoWidget = PageInfoWidget;
}( jQuery ) );

( function ( $ ) {
	/**
	 * Processor class to process the relevant nodes in the given element
	 *
	 * @param {jQuery} $container The container this class runs the process on.
	 * @param {Object} [config] Configuration options
	 * @param {boolean} [config.prefetch] If set to true, this will make the
	 *  system immediately fetch the data of all nodes and store them in the
	 *  cache. Consider using this if there are not many nodes in the given text;
	 *  however, if there are a lot of nodes, this might create wasteful and
	 *  unnecessary network calls.
	 * @param {string} [config.selector='[data-wikilookup]'] Selector to denote the nodes
	 *  in the given element that will be processed as wikilookup elements.
	 * @param {Object} [config.sources] An optional definition of sources
	 *  to fetch the data from. Defined sources can then be used by adding
	 *  a `data-wl-source="xxx"` attribute to a processed node.
	 *  Expected structure of the sources object:
	 *  {
	 *    sourceName: {
	 *      baseURL: (string) Optional
	 *      lang: (string) Optional
	 *    }
	 *  }
	 *  At least one of the key definitions (baseURL and/or lang)
	 *  should be defined; these will be used for the node that uses the
	 *  sourceName as its `data-wl-source` attribute value.
	 * @param {Object} [messages] An object representing the message text
	 *  for display for the various widget states.
	 *  - messages.pending: Text or jQuery node that appears when the widget
	 *    is in a pending state.
	 *  - messages.error: Text or jQuery node that appears when the widget
	 *    is in an error mode.
	 *  - messages.link: The text that appears for the 'read more' link that
	 *    links back to the page's origins
	 */
	var Processor = function ( $container, config ) {
		config = config || {};

		this.$container = $container;
		if ( !this.$container || !this.$container.length ) {
			throw new Error( 'wikilookup initialization error: Could not process given element.' );
		}

		this.prefetch = !!config.prefetch;
		this.selector = config.selector || '[data-wikilookup]';
		this.messages = config.messages || {};

		this.$nodes = $();
		this.sources = {};
		this.trigger = null;

		this.initializeNodes();
		this.initializeSources( config.sources );
		this.setUpdateTrigger( config.trigger );

		if ( config.prefetch ) {
			this.updateAllNodes();
		}
	};

	/**
	 * Go over all nodes and trigger their update process.
	 * This is mostly used to prefetch the data in the background.
	 */
	Processor.prototype.updateAllNodes = function () {
		var self = this;
		this.getNodes().each( function () {
			self.updateWidget( $( this ) );
		} );
	};

	/**
	 * Initialize the process by going over all nodes, normalize,
	 * store their view objects, and prepare for fetching.
	 */
	Processor.prototype.initializeNodes = function () {
		var self = this;

		this.$nodes = this.$container.find( this.selector )
			.filter( function () {
				var pageName = $( this ).attr( 'data-wl-title' ) || $( this ).text();
				return !!pageName.trim();
			} );

		this.$nodes.each( function () {
			var widget,
				pageName = $( this ).attr( 'data-wl-title' ) || $( this ).text();

			// Normalize by adding this attribute to the node
			$( this ).attr( 'data-wl-title', pageName.trim() );

			// Create a view object and store it in a reference
			widget = new $.wikilookup.PageInfoWidget( {
				messages: self.messages
			} );

			$( this ).data( 'wl-widget', widget );
		} );
	};

	/**
	 * Get the requested source. If source wasn't found, return
	 * the default source.
	 *
	 * @param  {string} sourceName Requested source name
	 * @return {$.wikilookup.Api} Source
	 */
	Processor.prototype.getSource = function ( sourceName ) {
		sourceName = sourceName || 'default';

		if ( !this.sources[ sourceName ] ) {
			sourceName = 'default';
		}

		return this.sources[ sourceName ];
	};

	/**
	 * Initialize the different sources that are given;
	 * create API classes per source and store for later use.
	 *
	 * @param  {Object} [sources] Source definition.
	 */
	Processor.prototype.initializeSources = function ( sources ) {
		var def;

		sources = $.extend( {}, sources );

		// Start with the default (this can be overridden, which is fine)
		this.sources = {
			'default': new $.wikilookup.Api()
		};

		for ( def in sources ) {
			this.sources[ def ] = new $.wikilookup.Api( sources[ def ] );
		}
	};

	/**
	 * Set the trigger for loading and updating the view.
	 * Normalize from available legal triggers.
	 * Go over all nodes and update the event handlers.
	 *
	 * @param {string} [trigger='click'] Chosen jQuery event trigger
	 */
	Processor.prototype.setUpdateTrigger = function ( trigger ) {
		var self = this,
			legalTriggers = [ 'click', 'mouseenter' ];

		if ( legalTriggers.indexOf( trigger ) === -1 ) {
			trigger = 'click'; // Default
		}

		if ( this.trigger === trigger ) {
			// No-op
			return;
		}

		this.getNodes().each( function () {
			if ( self.trigger && self.trigger !== trigger ) {
				// Remove the event from the previous triggers
				$( this ).off( self.trigger + '.wikilookupEvent' );
			}

			// Attach to the new trigger
			$( this ).on( trigger + '.wikilookupEvent', self.onTriggerEvent.bind( self, $( this ) ) );
		} );

		this.trigger = trigger;
	};

	/**
	 * Get the page info and update the view for the given node
	 *
	 * @param  {jQuery} $node The jQuery element for the node
	 */
	Processor.prototype.updateWidget = function ( $node ) {
		// Get the correct API object according to the source
		var pageName = $node.attr( 'data-wl-title' ),
			sourceName = $node.attr( 'data-wl-source' ) || 'default',
			lang = $node.attr( 'data-wl-lang' ),
			widget = $node.data( 'wl-widget' ),
			inProgress = !!$node.data( 'wl-state-fetching' ),
			source = this.getSource( sourceName );

		// This is already running.
		// Even though the API will give us the same (still running)
		// promise, we don't want to attach the .then's over and over
		if ( inProgress ) { return; }

		if ( !source ) {
			// Source doesn't exist; bail out
			// eslint-disable-next-line no-console
			console.error( 'wikilookup error: Could not recognize source "' + sourceName + '".' );
			return;
		}

		if ( widget.getState() === 'ready' ) {
			// The widget is already fetched and ready; bail out
			return;
		}

		// Trigger fetching from the API; if the data was
		// already fetched, this is a no-op, since it's cached
		$node.data( 'wl-state-fetching', true );
		source.getPageInfo( pageName, lang )
			.then(
				// Success
				function ( result ) {
					// Update widget
					widget.setData( result );
					widget.setState( 'ready' );
				},
				// Fail
				function () {
					// TODO: Maybe set error based on which error was given
					widget.setState( 'error' );
				}
			)
			.always( function () {
				// Remove fetching state
				$node.data( 'wl-state-fetching', false );
			} );
	};

	/**
	 * Respond to the trigger event; trigger the API fetching
	 * and update the view.
	 *
	 * @param {jQuery} $node The jQuery element for the node
	 */
	Processor.prototype.onTriggerEvent = function ( $node ) {
		this.updateWidget( $node );
	};

	/**
	 * Get all relevant nodes in the container
	 *
	 * @return {jQuery} A collection of relevant nodes
	 */
	Processor.prototype.getNodes = function () {
		return this.$nodes;
	};

	/**
	 * Get an array of all page name terms that will be searched
	 * in the API.
	 *
	 * @return {string[]} Array of terms from the processed nodes
	 */
	Processor.prototype.getAllTerms = function () {
		var terms = [];

		this.$nodes.each( function () {
			terms.push( $( this ).attr( 'data-wl-title' ) );
		} );

		return terms;
	};

	// Export to namespace
	$.wikilookup.Processor = Processor;
}( jQuery ) );

( function ( $ ) {
	/**
	 * jQuery plugin for wikilookup
	 *
	 * @param {Object} [options] Configuration options
	 *  See $.wikilookup.Processor for configuration options
	 */
	$.fn.wikilookup = function ( options ) {
		var processor = new $.wikilookup.Processor( $( this ), options );

		// Store instance
		$( this ).data( 'wl-processor', processor );
	};
}( jQuery ) );
