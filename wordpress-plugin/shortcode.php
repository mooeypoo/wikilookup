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
		'data-wl-title' => $this->getPropValue( $atts, 'title', $content ),
	];

	$source = $this->getPropValue( $atts, 'source' );
	if ( $source ) {
		$domAttributes[ 'data-wl-source' ] = $source;
	}

	return $nodeMaker->makeNode( 'foo bar', $domAttributes );
}

function wikilookup_scripts() {
	$scripts = [
		'js' => 'assets/lib/jquery.wikilookup.js',
		'oojs' => 'assets/lib/oojs.jquery.min.js',
		'ooui' => 'assets/lib/ooui.widgets.min.js',
		'popup' => 'assets/popup/wikilookup.popup.js',
	];

	$styles = [
		'wikimediaui' => 'assets/lib/oojs-ui-wikimediaui.min.css',
		'widgets.wikimediaui' => 'assets/lib/oojs-ui-widgets-wikimediaui.min.css',
		'wikilookup' => 'assets/lib/jquery.lookup.min.css',
		'popup' => 'assets/popup/wikilookup.popup.css',
	];

	foreach ( $scripts as $name => $src ) {
		wp_enqueue_script(
			'wikilookup-' . $name,
			plugin_dir_url( __FILE__ ) . $src,
			array( 'jquery' )
		);
	}

	foreach ( $scripts as $name => $src ) {
		// CSS
		wp_enqueue_script(
			'wikilookup-css-' . $name,
			plugin_dir_url( __FILE__ ) . $src
		);
	}
}

// Register shortcode
add_shortcode( 'wikilookup', 'wikilookup_shortcode' );

// Add plugin file
add_action( 'wp_enqueue_scripts', 'wikilookup_scripts' );
