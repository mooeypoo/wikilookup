( function ( $ ) {
	var defaultOptions = {
		selector: '[data-wikilookup]',
		sources: {}
	};

	$.fn.wikilookup = function ( options ) {
		options = $.extend( {}, defaultOptions, options );


	};
}( jQuery ) );
