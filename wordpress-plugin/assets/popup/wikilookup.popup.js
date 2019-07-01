( function ( $ ) {
	$( document ).ready( function () {
		$( '.content-area' ).wikilookup( {
			trigger: 'click', // Default, but make it explicit
			sources: {
				'default': {
					useRestbase: true
				},
				spanish: {
					// Since the default has baseURL from Wikipedia
					// that allows for {{lang}} variable, we just need
					// to supply a different variable
					lang: 'es'
				}
			}
		} );

		// Put the view in the display for this demo
		$( '.content-area [data-wikilookup]' ).each( function () {
			var widget = $( this ).data( 'wl-widget' ),
				popup = new OO.ui.PopupWidget( {
					width: 700,
					$floatableContainer: $( this ),
					$content: widget.$element,
					autoClose: true
				} );

			$( 'body' ).append( popup.$element );
			$( this ).on( 'click', popup.toggle.bind( popup ) );
		} );
	} );
}( jQuery) );
