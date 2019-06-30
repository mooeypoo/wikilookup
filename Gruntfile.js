/* eslint-env node */
module.exports = function Gruntfile( grunt ) {
	var config, unifiedJSFile, unifiedCSSFile,
		pkg = grunt.file.readJSON( 'package.json' );

	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-qunit' );
	grunt.loadNpmTasks( 'grunt-contrib-less' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-cssmin' );

	config = {
		pkg: pkg,
		eslint: {
			code: {
				src: [
					'src/js/*.js',
					'src/js/**/*.js',
					'!extension/**',
					'!node_modules/**'
				]
			}
		},
		qunit: {
			all: [ 'tests/index.html' ]
		},
		less: {
			plain: {
				// Set up below
				files: {}
			}
		},
		clean: {
			js: [ 'dist/jquery.wikilookup*.js', 'dist/jquery.wikilookup*.css' ]
		},
		concat: {
			jquery: {
				options: {
					// banner: grunt.file.read( 'build/header.jquery.wikilookup.txt' ),
					// Remove wrapping IIFE ( function () {}() );\n
					process: function ( src, filepath ) {
						// Only remove the end if we're removing the starting (function () { ... wrapper
						if ( new RegExp( /^\( function \(\) {/ ).test( src ) ) {
							src = src
								.replace( /^\( function \(\) {/, '' ) // Beginning of file
								.replace( /}\(\) \);\n$/, '' );
						}
						// eslint-disable-next-line quotes
						return '/* >> Starting source: ' + filepath + " << */\n" +
							src +
							'/* >> End source: ' + filepath + ' << */';
					}
				},
				// Set up below
				files: {}
			}
		},
		uglify: {
			options: { mangle: { reserved: [ 'jQuery', 'OO' ] } },
			// ooui: {
			// 	files: {
			// 		'demo/ooui/oojs-ui-core.min.js': 'src/ooui/oojs-ui-core.js',
			// 		'demo/ooui/oojs-ui-widgets.min.js': 'src/ooui/oojs-ui-widgets.js',
			// 		'demo/ooui/oojs-ui-wikimediaui.min.js': 'src/ooui/oojs-ui-wikimediaui.js'
			// 	}
			// },
			jquery: {
				files: {}
			},
		},
		cssmin: {
			// ooui: {
			// 	files: {
			// 		'demo/ooui/oojs-ui-wikimediaui.min.css': 'demo/ooui/oojs-ui-wikimediaui.css',
			// 		'demo/ooui/oojs-ui-widgets-wikimediaui.min.css': 'demo/ooui/oojs-ui-widgets-wikimediaui.css'
			// 	}
			// },
			jquery: {
				files: {}
			}
		}
	};

	// Set up filenames with versioning
	unifiedJSFile = 'dist/jquery.wikilookup-' + pkg.version + '.js';
	unifiedCSSFile = 'dist/jquery.wikilookup-' + pkg.version + '.plain.css';
	config.concat.jquery.files[ unifiedJSFile ] = [
		'src/js/namespace.js',
		'src/js/tools.js',
		'src/js/Api.js',
		'src/js/PageInfoWidget.js',
		'src/js/Processor.js',
		'src/js/wikilookup.js'
	];
	config.less.plain.files[ unifiedCSSFile ] = 'src/less/index.less';

	// Minify
	config.uglify.jquery.files[ 'dist/jquery.wikilookup-' + pkg.version + '.min.js' ] = unifiedJSFile;
	config.cssmin.jquery.files[ 'dist/jquery.wikilookup-' + pkg.version + '.min.css' ] = unifiedCSSFile;

	// Initialize config
	grunt.initConfig( config );

	grunt.registerTask( 'lint', [ 'eslint' ] );
	grunt.registerTask( 'test', [ 'lint', 'qunit' ] );
	grunt.registerTask( 'build', [ 'test', 'clean:js', 'less:plain', 'concat:jquery', 'uglify:jquery', 'cssmin:jquery' ] );
	grunt.registerTask( 'default', 'build' );
};
