( function ( $ ) {
	/**
	 * jQuery plugin for wikilookup
	 *
	 * @param {Object} [options] Configuration options
	 *  See Wikilookup.Processor for configuration options
	 */
	$.fn.wikilookup = function ( options ) {
		var processor = new Wikilookup.Processor( this, options );

		// Store instance
		this.data( 'wl-processor', processor );
	};
}( jQuery ) );
