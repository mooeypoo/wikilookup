( function () {
	QUnit.module( '$.wikilookup.tools' );

	QUnit.test( 'getPropValue', function ( assert ) {
		var cases = [
			{
				msg: 'Nonexisting object',
				obj: null,
				props: [ 'foo' ],
				expected: undefined
			},
			{
				msg: 'Existing object, shallow property',
				obj: { foo: { bar: { baz: 'quuz' } } },
				props: [ 'foo' ],
				expected: { bar: { baz: 'quuz' } }
			},
			{
				msg: 'Existing object, deep property',
				obj: { foo: { bar: { baz: 'quuz' } } },
				props: [ 'foo', 'bar', 'baz' ],
				expected: 'quuz'
			},
			{
				msg: 'Existing object, deep nonexisting property',
				obj: { foo: { bar: { baz: 'quuz' } } },
				props: [ 'foo', 'bar', 'bar' ],
				expected: undefined
			},
			{
				msg: 'Existing object, deep nonexisting property (nested deeper)',
				obj: { foo: { bar: { baz: 'quuz' } } },
				props: [ 'foo', 'bar', 'bar', 'blah', 'blip', 'blop' ],
				expected: undefined
			}
		];

		cases.forEach( function ( testCase ) {
			assert.deepEqual(
				$.wikilookup.tools.getPropValue( testCase.obj, testCase.props ),
				testCase.expected,
				testCase.msg
			);
		} );
	} );

}() );
