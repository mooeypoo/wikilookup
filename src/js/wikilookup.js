( function () {
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
}() );
