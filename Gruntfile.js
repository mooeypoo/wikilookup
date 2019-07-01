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
	grunt.loadNpmTasks('grunt-contrib-copy');

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
					// banner: grunt.file.read( 'build/header.jquery.wikilookup.txt' )
				},
				// Set up below
				files: {}
			},
			ooui: {
				files: {
					'demo/popup/ooui.widgets.js': [
						'demo/popup/ooui/open.js',
						'demo/popup/ooui/oojs-ui-core.js',
						'demo/popup/ooui/oojs-ui-widgets.js',
						'demo/popup/ooui/oojs-ui-wikimediaui.js',
						'demo/popup/ooui/close.js'
					]
				}
			},
			wordpress: {
				files: {
					'wordpress-plugin/assets/wikilookup.unified.js': [
						// 'wordpress-plugin/assets/lib/oojs.jquery.min.js',
						'wordpress-plugin/assets/lib/oojs.jquery.js',
						'wordpress-plugin/assets/lib/ooui.widgets.min.js',
						'wordpress-plugin/assets/lib/jquery.wikilookup.min',
					]
				}
			}
		},
		uglify: {
			options: { mangle: { reserved: [ 'jQuery', 'OO' ] } },
			ooui: {
				files: {
					'demo/popup/ooui.widgets.min.js': 'demo/popup/ooui.widgets.js'
				}
			},
			jquery: {
				files: {}
			},
		},
		cssmin: {
			ooui: {
				files: {
					'demo/popup/oojs-ui-wikimediaui.min.css': 'demo/popup/ooui/oojs-ui-wikimediaui.css',
					'demo/popup/oojs-ui-widgets-wikimediaui.min.css': 'demo/popup/ooui/oojs-ui-widgets-wikimediaui.css',
					'demo/popup/oojs-ui-wikimediaui.rtl.min.css': 'demo/popup/ooui/oojs-ui-wikimediaui.rtl.css',
					'demo/popup/oojs-ui-widgets-wikimediaui.rtl.min.css': 'demo/popup/ooui/oojs-ui-widgets-wikimediaui.rtl.css'
				}
			},
			jquery: {
				files: {}
			}
		},
		copy: {
			wordpress: {
				files: {}
			}
		}
	};

	// Set up filenames with versioning
	unifiedJSFile = 'dist/jquery.wikilookup-' + pkg.version + '.js';
	unifiedCSSFile = 'dist/jquery.wikilookup-' + pkg.version + '.css';
	unifiedJSFileMinimized = 'dist/jquery.wikilookup-' + pkg.version + '.min.js';
	unifiedCSSFileMinimized = 'dist/jquery.wikilookup-' + pkg.version + '.min.css';
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
	config.uglify.jquery.files[ unifiedJSFileMinimized ] = unifiedJSFile;
	config.cssmin.jquery.files[ unifiedCSSFileMinimized ] = unifiedCSSFile;

	// // Copy to wordpress plugin
	// config.copy.wordpress.files = [
	// 	{ src: unifiedJSFileMinimized, dest: 'wordpress-plugin/assets/lib/jquery.wikilookup.min.js' },
	// 	{ src: unifiedCSSFileMinimized, dest: 'wordpress-plugin/assets/lib/jquery.wikilookup.min.css' }
	// ];

	// Initialize config
	grunt.initConfig( config );

	grunt.registerTask( 'lint', [ 'eslint' ] );
	grunt.registerTask( 'test', [ 'lint', 'qunit' ] );
	grunt.registerTask( 'build', [
		'test',
		'clean:js',
		'less:plain',
		'concat:jquery',
		'uglify:jquery',
		'cssmin:jquery',
		'concat:ooui',
		'uglify:ooui',
		'cssmin:ooui',
		'copy:wordpress',
		'concat:wordpress'
	] );
	grunt.registerTask( 'default', 'build' );
};
