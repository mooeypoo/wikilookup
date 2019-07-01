$( document ).ready( function () {
	var $display = $( '.display' );

	$( '.demoText' ).wikilookup( {
		trigger: 'click', // Default, but make it explicit
		sources: {
			spanish: {
				// Since the default has baseURL from Wikipedia
				// that allows for {{lang}} variable, we just need
				// to supply a different variable
				lang: 'es'
			}
		}
	} );

	// Put the view in the display for this demo
	$( '.demoText [data-wikilookup]' ).each( function () {
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
