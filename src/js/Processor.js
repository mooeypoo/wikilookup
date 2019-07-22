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
	 * @param {boolean} [hideThumb] Never show the image thumbnails
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
		this.hideThumb = !!config.hideThumb;

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
				messages: self.messages,
				hideThumb: self.hideThumb
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
