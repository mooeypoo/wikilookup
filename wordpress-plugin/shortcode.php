<?php
/*
* Plugin Name: Wikilookup
* Description: Add popups from wiki to your content.
* Version: 1.0
* Author: Moriel Schottlender
* Author URI: https://moriel.smarterthanthat.com
*/

class NodeMaker {
	protected $dom;

	function __construct() {
		$this->dom = new DOMDocument('1.0', 'utf-8');
	}

	public function makeNode( $content, $domAttributes ) {
		$domElement = $this->dom->createElement( 'span' );
		$domElement->nodeValue = $content;
		$domElement->setAttribute( 'data-wikilookup' );

		foreach ( $domAttributes as $attr => $val ) {
			$domElement->setAttribute( $attr, $val );
		}
		return $domElement->ownerDocument->saveXML( $domElement );
	}
}

function getPropValue( $arr, $prop, $default = null ) {
	return isset( $arr[ $prop ] ) ?
		$arr[ $prop ] : $default;
}

// Add Shortcode
function wikilookup_shortcode( $atts , $content = null ) {
	$nodeMaker = new NodeMaker();

	// Attributes
	$atts = shortcode_atts(
		array(
		),
		$atts,
		'wikilookup'
	);

	$domAttributes = [
		'data-wikilookup' => null,
		'data-wl-title' => getPropValue( $atts, 'title', $content ),
	];

	$source = getPropValue( $atts, 'source' );
	if ( $source ) {
		$domAttributes[ 'data-wl-source' ] = $source;
	}

	return $nodeMaker->makeNode( $content, $domAttributes );
}

function wikilookup_scripts() {
	$scripts = [
		// ooui popup widgets
		'oojs' => [
			'src' => 'assets/ooui/oojs.jquery.js',
			'dependencies' => [ 'jquery' ],
		],
		'ooui-core' => [
			'src' => 'assets/ooui/oojs-ui-core.js',
			'dependencies' => [ 'oojs' ],
		],
		'ooui-widgets' => [
			'src' => 'assets/ooui/oojs-ui-widgets.js',
			'dependencies' => [ 'ooui-core' ],
		],
		'ooui-wikimediaui' => [
			'src' => 'assets/ooui/oojs-ui-wikimediaui.js',
			'dependencies' => [ 'ooui-widgets' ],
		],
		// wikilookup
		'wikilookup' => [
			'src' => 'assets/jquery.wikilookup-0.1.0.js',
			'dependencies' => [ 'jquery' ]
		],
		// popup code
		'popup' => [
			'src' => 'assets/popup/wikilookup.popup.js',
			'dependencies' => [  'jquery', 'wikilookup', 'ooui-wikimediaui' ],
		]
	];

	$styles = [
		'wikimediaui' => 'assets/css/oojs-ui-wikimediaui.min.css',
		'widgets.wikimediaui' => 'assets/css/oojs-ui-widgets-wikimediaui.min.css',
		'wikilookup' => 'assets/css/jquery.wikilookup.min.css',
		'popup' => 'assets/popup/wikilookup.popup.css',
	];

	foreach ( $scripts as $name => $data ) {
		wp_enqueue_script(
			'wikilookup-js-' . $name,
			plugin_dir_url( __FILE__ ) . $data[ 'src'],
			array_map(
				function ( $item ) {
					return $item === 'jquery' ?
						'jquery' :
						'wikilookup-js-' . $item;
				},
				$data[ 'dependencies' ]
			),
			false,
			true // in footer
		);
	}

	foreach ( $styles as $name => $src ) {
		// CSS
		wp_enqueue_style(
			'wikilookup-css-' . $name,
			plugin_dir_url( __FILE__ ) . $src
		);
	}
}

// Register shortcode
add_shortcode( 'wikilookup', 'wikilookup_shortcode' );

// Add plugin file
add_action( 'wp_enqueue_scripts', 'wikilookup_scripts' );
