( function () {
	QUnit.module( 'Wikilookup.Api' );

	QUnit.test( 'getApiUrl', function ( assert ) {
		var cases = [
			{
				baseURL: 'https://foo.wikipedia.org/w/api.php',
				pageName: 'Foo',
				lang: 'en',
				expected: 'https://foo.wikipedia.org/w/api.php',
				msg: 'BaseURL without parameters'
			},
			{
				baseURL: 'https://{{lang}}.wikipedia.org/w/api.php',
				pageName: 'Foo',
				lang: 'he',
				expected: 'https://he.wikipedia.org/w/api.php',
				msg: 'BaseURL with language parameter'
			},
			{
				baseURL: 'https://{{lang}}.wikipedia.org/w/api.php',
				pageName: 'Foo',
				lang: null,
				expected: 'https://en.wikipedia.org/w/api.php',
				msg: 'BaseURL with language parameter, but fallback on default'
			},
			{
				baseURL: 'https://foo.wikipedia.org/w/api.php?title={{pageName}}',
				pageName: 'Foo',
				lang: 'he',
				expected: 'https://foo.wikipedia.org/w/api.php?title=Foo',
				msg: 'BaseURL with pageName parameter'
			},
			{
				baseURL: 'https://foo.wikipedia.org/w/api.php?title={{pageName}}',
				pageName: 'Foo bar',
				lang: 'he',
				expected: 'https://foo.wikipedia.org/w/api.php?title=Foo%20bar',
				msg: 'BaseURL with pageName parameter normalized for URL'
			},
			{
				baseURL: 'https://{{lang}}.wikipedia.org/w/api.php?title={{pageName}}',
				pageName: 'Foo bar',
				lang: 'he',
				expected: 'https://he.wikipedia.org/w/api.php?title=Foo%20bar',
				msg: 'BaseURL with pageName and lang parameters'
			}
		];

		cases.forEach( function ( testCase ) {
			var api = new Wikilookup.Api( { baseURL: testCase.baseURL } );
			assert.deepEqual(
				api.getApiUrl( testCase.pageName, testCase.lang ),
				testCase.expected,
				testCase.msg
			);
		} );
	} );

	QUnit.test( 'getApiParams', function ( assert ) {
		var cases = [
				{
					msg: 'Default config',
					construct: null,
					pageName: 'Foo page',
					expected: {
						url: 'https://en.wikipedia.org/w/api.php',
						dataType: 'jsonp',
						data: {
							action: 'query',
							format: 'json',
							prop: 'info|pageimages|extracts',
							titles: 'Foo page',
							inprop: 'url',
							piprop: 'thumbnail',
							pithumbsize: 300,
							redirects: '1',
							exsentences: 5,
							// explaintext: '1',
							exintro: '1'
						}
					}
				},
				{
					msg: 'Use restbase',
					construct: { useRestbase: true },
					pageName: 'Bar foo',
					expected: {
						url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Bar%20foo',
						data: { redirect: true }
					}
				},
				{
					msg: 'Language = he',
					construct: { lang: 'he' },
					pageName: 'ואהבת לרעך כמוך',
					expected: {
						url: 'https://he.wikipedia.org/w/api.php',
						dataType: 'jsonp',
						data: {
							action: 'query',
							format: 'json',
							prop: 'info|pageimages|extracts',
							titles: 'ואהבת לרעך כמוך',
							inprop: 'url',
							piprop: 'thumbnail',
							pithumbsize: 300,
							redirects: '1',
							exsentences: 5,
							// explaintext: '1',
							exintro: '1'
						}
					}
				},
				{
					msg: 'Use restbase, lang=he',
					construct: { useRestbase: true, lang: 'he' },
					pageName: 'ואהבת לרעך כמוך',
					expected: {
						// url encoded
						url: 'https://he.wikipedia.org/api/rest_v1/page/summary/%D7%95%D7%90%D7%94%D7%91%D7%AA%20%D7%9C%D7%A8%D7%A2%D7%9A%20%D7%9B%D7%9E%D7%95%D7%9A',
						data: { redirect: true }
					}
				},
				{
					msg: 'Custom entrypoint',
					construct: { baseURL: 'http://foo.my.wiki/w/api.php' },
					pageName: 'Page thing',
					expected: {
						url: 'http://foo.my.wiki/w/api.php',
						dataType: 'jsonp',
						data: {
							action: 'query',
							format: 'json',
							prop: 'info|pageimages|extracts',
							titles: 'Page thing',
							inprop: 'url',
							piprop: 'thumbnail',
							pithumbsize: 300,
							redirects: '1',
							exsentences: 5,
							// explaintext: '1',
							exintro: '1'
						}
					}
				},
				{
					msg: 'Use restbase, custom entrypoint',
					construct: { useRestbase: true, baseURL: 'https://some.url.that.is.not.wikipedia/with/some/structure/{{pageName}}' },
					pageName: 'Bar foo',
					expected: {
						url: 'https://some.url.that.is.not.wikipedia/with/some/structure/Bar%20foo',
						data: { redirect: true }
					}
				},
			];

		cases.forEach( function ( testCase ) {
			var api = new Wikilookup.Api( testCase.construct );
			assert.deepEqual(
				api.getApiParams( testCase.pageName ),
				testCase.expected,
				testCase.msg
			);
		} );
	} );

	QUnit.test( 'getCacheKey', function ( assert ) {
		var cases = [
			{
				msg: 'No change to pagename',
				pageName: 'regular',
				expected: 'en|regular'
			},
			{
				msg: 'Name with spaces',
				pageName: 'page name',
				expected: 'en|page_name'
			},
			{
				msg: 'Name with spaces and upper case',
				pageName: 'Page Name',
				expected: 'en|page_name'
			},
			{
				msg: 'Different language, with spaces',
				pageName: 'ואהבת לרעך כמוך',
				lang: 'he',
				expected: 'he|ואהבת_לרעך_כמוך'
			},
			{
				msg: 'Multiple spaces; trim',
				pageName: '     Page     Name      ',
				expected: 'en|page_____name'
			},
		];

		cases.forEach( function ( testCase ) {
			var api = new Wikilookup.Api();
			assert.deepEqual(
				api.getCacheKey( testCase.pageName, testCase.lang ),
				testCase.expected,
				testCase.msg
			);
		} );

	} );

	QUnit.test( 'processApiResult', function ( assert ) {
		var api,
			expected = {
				api: {
					title: 'Physics',
					content: 'Physics (from Ancient Greek: \u03c6\u03c5\u03c3\u03b9\u03ba\u03ae (\u1f10\u03c0\u03b9\u03c3\u03c4\u03ae\u03bc\u03b7), romanized: physik\u1e17 (epist\u1e17m\u0113), lit. \'knowledge of nature\', from \u03c6\u03cd\u03c3\u03b9\u03c2 ph\u00fdsis \"nature\") is the natural science that studies matter, its motion and behavior through space and time, and that studies the related entities of energy and force. Physics is one of the most fundamental scientific disciplines, and its main goal is to understand how the universe behaves.Physics is one of the oldest academic disciplines and, through its inclusion of astronomy, perhaps the oldest. Over much of the past two millennia, physics, chemistry, biology, and certain branches of mathematics, were a part of natural philosophy, but during the Scientific Revolution in the 17th century these natural sciences emerged as unique research endeavors in their own right. Physics intersects with many interdisciplinary areas of research, such as biophysics and quantum chemistry, and the boundaries of physics are not rigidly defined. New ideas in physics often explain the fundamental mechanisms studied by other sciences and suggest new avenues of research in academic disciplines such as mathematics and philosophy.\nAdvances in physics often enable advances in new technologies. For example, advances in the understanding of electromagnetism, solid-state physics, and nuclear physics led directly to the development of new products that have dramatically transformed modern-day society, such as television, computers, domestic appliances, and nuclear weapons; advances in thermodynamics led to the development of industrialization; and advances in mechanics inspired the development of calculus.',
					thumbnail: {
						source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/CollageFisica.jpg/300px-CollageFisica.jpg',
						width: 300,
						height:217
					},
					url: 'https://en.wikipedia.org/wiki/Physics',
					history: 'https://en.wikipedia.org/wiki/Physics?action=history',
					dir: 'ltr',
					wikipedia: true,
					// TODO: test with external source
					source: {
						logo: '',
						title: ''
					}
				},
				restbase: {
					title: 'Physics',
					// Content shorter and anything inside () is stripped from restbase
					content: 'Physics is the natural science that studies matter, its motion and behavior through space and time, and that studies the related entities of energy and force. Physics is one of the most fundamental scientific disciplines, and its main goal is to understand how the universe behaves.',
					thumbnail: {
						source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/CollageFisica.jpg/320px-CollageFisica.jpg',
						// We also get slightly different sized images for thumbs
						width: 320,
						height:231
					},
					url: 'https://en.wikipedia.org/wiki/Physics',
					history: 'https://en.wikipedia.org/wiki/Physics?action=history',
					dir: 'ltr',
					wikipedia: true,
					// TODO: test with external source
					source: {
						logo: '',
						title: ''
					}
				}
			},
			apiResults = {
				// PageName = Physics
				// https://en.wikipedia.org/w/api.php?action=query&format=json&prop=info%7Cpageimages%7Cextracts&titles=Physics&inprop=url&piprop=thumbnail&pithumbsize=300&redirects=1&explaintext=1&exintro=1
				api: {"batchcomplete":"","query":{"pages":{"22939":{"pageid":22939,"ns":0,"title":"Physics","contentmodel":"wikitext","pagelanguage":"en","pagelanguagehtmlcode":"en","pagelanguagedir":"ltr","touched":"2019-06-27T17:36:04Z","lastrevid":902734855,"length":90385,"fullurl":"https://en.wikipedia.org/wiki/Physics","editurl":"https://en.wikipedia.org/w/index.php?title=Physics&action=edit","canonicalurl":"https://en.wikipedia.org/wiki/Physics","thumbnail":{"source":"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/CollageFisica.jpg/300px-CollageFisica.jpg","width":300,"height":217},"extract":"Physics (from Ancient Greek: \u03c6\u03c5\u03c3\u03b9\u03ba\u03ae (\u1f10\u03c0\u03b9\u03c3\u03c4\u03ae\u03bc\u03b7), romanized: physik\u1e17 (epist\u1e17m\u0113), lit. 'knowledge of nature', from \u03c6\u03cd\u03c3\u03b9\u03c2 ph\u00fdsis \"nature\") is the natural science that studies matter, its motion and behavior through space and time, and that studies the related entities of energy and force. Physics is one of the most fundamental scientific disciplines, and its main goal is to understand how the universe behaves.Physics is one of the oldest academic disciplines and, through its inclusion of astronomy, perhaps the oldest. Over much of the past two millennia, physics, chemistry, biology, and certain branches of mathematics, were a part of natural philosophy, but during the Scientific Revolution in the 17th century these natural sciences emerged as unique research endeavors in their own right. Physics intersects with many interdisciplinary areas of research, such as biophysics and quantum chemistry, and the boundaries of physics are not rigidly defined. New ideas in physics often explain the fundamental mechanisms studied by other sciences and suggest new avenues of research in academic disciplines such as mathematics and philosophy.\nAdvances in physics often enable advances in new technologies. For example, advances in the understanding of electromagnetism, solid-state physics, and nuclear physics led directly to the development of new products that have dramatically transformed modern-day society, such as television, computers, domestic appliances, and nuclear weapons; advances in thermodynamics led to the development of industrialization; and advances in mechanics inspired the development of calculus."}}}},
				// https://en.wikipedia.org/api/rest_v1/page/summary/Physics
				restbase: {"type":"standard","title":"Physics","displaytitle":"Physics","namespace":{"id":0,"text":""},"wikibase_item":"Q413","titles":{"canonical":"Physics","normalized":"Physics","display":"Physics"},"pageid":22939,"thumbnail":{"source":"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/CollageFisica.jpg/320px-CollageFisica.jpg","width":320,"height":231},"originalimage":{"source":"https://upload.wikimedia.org/wikipedia/commons/9/9a/CollageFisica.jpg","width":831,"height":600},"lang":"en","dir":"ltr","revision":"902734855","tid":"f71eb4a0-9785-11e9-80a0-4fab8e21055b","timestamp":"2019-06-20T21:42:30Z","description":"Study of the fundamental properties of matter and energy","content_urls":{"desktop":{"page":"https://en.wikipedia.org/wiki/Physics","revisions":"https://en.wikipedia.org/wiki/Physics?action=history","edit":"https://en.wikipedia.org/wiki/Physics?action=edit","talk":"https://en.wikipedia.org/wiki/Talk:Physics"},"mobile":{"page":"https://en.m.wikipedia.org/wiki/Physics","revisions":"https://en.m.wikipedia.org/wiki/Special:History/Physics","edit":"https://en.m.wikipedia.org/wiki/Physics?action=edit","talk":"https://en.m.wikipedia.org/wiki/Talk:Physics"}},"api_urls":{"summary":"https://en.wikipedia.org/api/rest_v1/page/summary/Physics","metadata":"https://en.wikipedia.org/api/rest_v1/page/metadata/Physics","references":"https://en.wikipedia.org/api/rest_v1/page/references/Physics","media":"https://en.wikipedia.org/api/rest_v1/page/media/Physics","edit_html":"https://en.wikipedia.org/api/rest_v1/page/html/Physics","talk_page_html":"https://en.wikipedia.org/api/rest_v1/page/html/Talk:Physics"},"extract":"Physics is the natural science that studies matter, its motion and behavior through space and time, and that studies the related entities of energy and force. Physics is one of the most fundamental scientific disciplines, and its main goal is to understand how the universe behaves.","extract_html":"<p><b>Physics</b> is the natural science that studies matter, its motion and behavior through space and time, and that studies the related entities of energy and force. Physics is one of the most fundamental scientific disciplines, and its main goal is to understand how the universe behaves.</p>"}
			};

		api = new Wikilookup.Api( { useRestbase: true } );
		assert.deepEqual(
			api.processApiResult( apiResults.restbase ),
			expected.restbase,
			'Resetbase result'
		);

		api = new Wikilookup.Api( { useRestbase: false } );
		assert.deepEqual(
			api.processApiResult( apiResults.api ),
			expected.api,
			'Regular API result'
		);
	} );
}() );
