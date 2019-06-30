( function () {
	QUnit.module( '$.wikilookup.Processor' );

	QUnit.test( 'initialization and getAllTerms', function ( assert ) {
		var cases = [
			{
				msg: 'Spans; default config',
				config: {},
				html: '<p>Lorem <span data-wikilookup>ipsum dolor</span> sit amet, consectetur adipiscing elit. Fusce leo odio, mollis vitae consectetur non, euismod eget turpis. <span data-wikilookup>Vivamus</span> pellentesque tellus a est ullamcorper cursus. <span data-wikilookup>Praesent euismod </span>lorem nec felis facilisis, sit amet rutrum tortor ullamcorper. Donec imperdiet varius ante, sit amet vestibulum risus efficitur eget. Fusce rhoncus consectetur <span>mi</span> quis varius. Phasellus in lorem quis tellus suscipit imperdiet. Quisque sit amet ullamcorper nulla, ac placerat justo. Vestibulum non scelerisque lectus, quis sodales tellus. Quisque sagittis viverra elit, <span data-wikilookup>sed pellentesque</span> sem congue quis. Vestibulum finibus fermentum leo, ac rutrum lacus varius eget.</p>',
				expected: [ 'ipsum dolor', 'Vivamus', 'Praesent euismod', 'sed pellentesque' ]
			},
			{
				msg: 'Mix of nodes: <span>, <a>, <button>, <label>; default config',
				config: {},
				html: '<p>Lorem <a data-wikilookup>ipsum dolor</a> sit amet, consectetur adipiscing elit. Fusce leo odio, mollis vitae consectetur non, euismod eget turpis. <span data-wikilookup>Vivamus</span> pellentesque tellus a est ullamcorper cursus. <span data-wikilookup>Praesent euismod </span>lorem nec felis facilisis, sit amet rutrum tortor ullamcorper. Donec imperdiet varius ante, sit amet vestibulum risus efficitur eget. Fusce rhoncus consectetur <span>mi</span> quis varius. <button data-wikilookup>Phasellus</button> in lorem quis tellus suscipit imperdiet. Quisque sit amet ullamcorper nulla, ac placerat justo. Vestibulum non scelerisque lectus, quis sodales tellus. <label data-wikilookup>Quisque</label> sagittis viverra elit, <span data-wikilookup>sed pellentesque</span> sem congue quis. Vestibulum finibus fermentum leo, ac rutrum lacus varius eget.</p>',
				expected: [ 'ipsum dolor', 'Vivamus', 'Praesent euismod', 'Phasellus', 'Quisque', 'sed pellentesque' ]
			},
			{
				msg: 'Mix of nodes; custom broad selector "a"',
				config: { selector: 'a' },
				html: '<p>Lorem <a data-wikilookup>ipsum dolor</a> sit amet, consectetur adipiscing elit. Fusce leo odio, mollis vitae consectetur non, euismod eget turpis. <span data-wikilookup>Vivamus</span> pellentesque tellus a est ullamcorper cursus. <span data-wikilookup>Praesent euismod </span>lorem nec felis facilisis, sit amet rutrum tortor ullamcorper. Donec imperdiet varius ante, sit amet vestibulum risus efficitur eget. Fusce rhoncus consectetur <span>mi</span> quis varius. <button data-wikilookup>Phasellus</button> in lorem quis tellus suscipit imperdiet. Quisque sit amet ullamcorper nulla, ac placerat justo. Vestibulum non scelerisque lectus, quis sodales tellus. <label data-wikilookup>Quisque</label> <a href="http://example.com">sagittis</a> viverra elit, <span data-wikilookup>sed pellentesque</span> sem congue quis. Vestibulum finibus fermentum leo, ac rutrum lacus varius eget.</p>',
				expected: [ 'ipsum dolor', 'sagittis' ]
			}
		];

		cases.forEach( function ( testCase ) {
			var processor = new $.wikilookup.Processor(
				$( $.parseHTML( testCase.html ) ),
				testCase.config
			);

			assert.deepEqual(
				processor.getAllTerms(),
				testCase.expected,
				testCase.msg
			);
		} );
	} );

	QUnit.test( 'sources', function ( assert ) {
		var source,
			processor = new $.wikilookup.Processor( $( '<div>' ), {
			sources: {
				one: { lang: 'es' },
				two: { baseURL: 'https://{{lang}}.privatewiki.com/w/api.php', lang: 'foo' },
				three: {}
			}
		} );

		assert.deepEqual(
			Object.keys( processor.sources ),
			[ 'default', 'one', 'two', 'three' ],
			'All sources that have data instantiated.'
		);

		source = processor.getSource( 'one' );
		assert.ok(
			source instanceof $.wikilookup.Api,
			'API details instantiated.'
		);
	} );
}() );
