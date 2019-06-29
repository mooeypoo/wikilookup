( function () {
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
}() );
