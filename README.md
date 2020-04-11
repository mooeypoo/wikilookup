# Wikilookup
Wikilookup is a JavaScript library that enables you to add quick information from Wikipedia and other wikis.

**Are you looking for the Wordpress plugin? [It's here!](https://github.com/mooeypoo/wikilookup-wordpress)**

## Use the plugin
To use Wikilookup, include it in your page:
```
	<script src="../dist/jquery.wikilookup-1.0.0.js"></script>
	<link rel="stylesheet" href="jquery.wikilookup-1.0.0.min.css">
```
Call the plugin on the DOM element that holds your text.

```$( '.content').wikilookup();```

By default, the plugin looks for elements tagged by `data-wikilookup` property.

You can change that property by providing an alternative selector:

```$( '.content').wikilookup( { selector: '.someClass' } );```

## Showing the data

Wikilookup manages the operation of fetching the data and creating a display, but it is agnostic as to where that display is placed. Deciding where the results appear is up to you.

The view for each lookup word is stored in the `data-wl-widget` data attribute of that node. The presentation jQuery object is stored in the `$element` property of that object. You can call for it and display it wherever you want.

See the demos for an example.

## Demo
For information about the configuration, [visit the demo page](https://mooeypoo.github.io/jquery.wikilookup/).

## Contribute and help!
Wikilookup is an open source project. Please feel free to submit issues and/or pull requests.

## Changelog
See [CHANGELOG](CHANGELOG.md)

## Author
- Developed by Moriel Schottlender
- Design guidance by Nirzar Pangarkar
