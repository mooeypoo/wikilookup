( function () {
	// var defaultOptions = {
	// 	selector: '[data-wikilookup]',
	// 	sources: {}
	// };
	//
	// /**
	//  * jQuery plugin for wikilookup
	//  *
	//  * @param {Object} [options] Configuration options
	//  * @param {boolean} [options.prefetch] If set to true, this will make the
	//  *  system immediately fetch the data of all nodes and store them in the
	//  *  cache. Consider using this if there are not many nodes in the given text;
	//  *  however, if there are a lot of nodes, this might create wasteful and
	//  *  unnecessary network calls.
	//  * @param {string} [options.selector] Selector to denote the nodes
	//  *  in the given element that will be processed as wikilookup elements.
	//  * @param {Object} [options.sources] An optional definition of sources
	//  *  to fetch the data from. Defined sources can then be used by adding
	//  *  a `data-wl-source="xxx"` attribute to a processed node.
	//  *  Expected structure of the sources object:
	//  *  {
	//  *    sourceName: {
	//  *      baseURL: (string) Optional
	//  *      lang: (string) Optional
	//  *    }
	//  *  }
	//  *  Per source, at least one of the key definitions (baseURL and/or lang)
	//  *  should be defined; these will be used for the node that uses the
	//  *  sourceName as its `data-wl-source` attribute value.
	//  */
	// $.fn.wikilookup = function ( options ) {
	// 	// options = $.extend( {}, defaultOptions, options );
	// 	//
	// 	// if ( !this.options.selector ) {
	// 	// 	// Error!
	// 	// 	console.error( 'wikilookup initialization error: You cannot specify an empty selector.' );
	// 	// 	return;
	// 	// }
	// 	//
	// 	// $( this ).find( this.options.selector ).each( function () {
	// 	// 	var pageName = $( this ).attr( 'data-wl-title' ) || $( this ).text(),
	// 	// 		lang = $( this ).attr( 'data-wl-lang' ) || 'en',
	// 	// 		source = $( this ).attr( 'data-wl-source' ) || '';
	// 	//
	// 	// 	if ( !pageName ) {
	// 	// 		// If we couldn't find a title or pageName, skip
	// 	// 		return;
	// 	// 	}
	// 	//
	// 	// 	if ( options.prefetch ) {
	// 	// 		// $.wikilookup.api();
	// 	// 	}
	// 	//
	// 	// } );
	// };
}() );
