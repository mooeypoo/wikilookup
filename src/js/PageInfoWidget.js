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
	 * @param {boolean} [dark] Toggle presentation in dark mode
	 */
	var PageInfoWidget = function ( config ) {
		config = config || {};

		this.$element = config.$element || $( '<div>' );

		this.hideThumb = !!config.hideThumb;
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
		this.dark = false;

		// Initialize
		this.setState( 'pending' );
		this.toggleDarkMode( !!config.dark );
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
	 * Toggle the widget to present in dark or light mode
	 *
	 * @param  {boolean} isDark Dark mode enabled
	 */
	PageInfoWidget.prototype.toggleDarkMode = function ( isDark ) {
		this.dark = isDark === undefined ? !this.dark : !!isDark;
		this.$element.toggleClass( 'wl-dark', this.dark );

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
		this.$copyright = $( '<a>' )
			.addClass( 'wl-pageInfoWidget-view-copyrightLink' )
			.text( 'See article for copyright information' );
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
			.addClass( 'wl-pageInfoWidget-view-articleHistory' )
			.attr( 'target', '_blank' )
			.append( this.messages.articleHistory );
		// Build the widget
		// TODO: Allow giving the widget a previously built
		// structure or template to use
		return $( '<div>' )
			.addClass( 'wl-pageInfoWidget-content-ready' )
			.append(
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-box wl-pageInfoWidget-box-text' )
					.append(
						// $( '<div>' )
						// 	.addClass( 'wl-pageInfoWidget-view-copyright' )
						// 	.append( this.$copyright ),
						this.$logo,
						this.$title,
						this.$content,
						this.$link,
						this.$historyLink,
						this.$copyright
					),
				$( '<div>' )
					.addClass( 'wl-pageInfoWidget-box wl-pageInfoWidget-box-image' )
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
		this.$thumb.toggle( !!data.thumbnail.source && !this.hideThumb );
		this.$element.attr( 'dir', data.dir || 'ltr' );
		this.$link.attr( 'href', data.url );
		this.$copyright.attr( 'href', data.url );
		this.$historyLink.attr( 'href', data.history );

		this.$element
			.toggleClass( 'wl-pageInfoWidget-wikipedia', !!data.wikipedia )
			.toggleClass( 'wl-pageInfoWidget-externalwiki', !data.wikipedia )
			.toggleClass( 'wl-pageInfoWidget-customlogo', !data.wikipedia && !!data.source.logo )
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
