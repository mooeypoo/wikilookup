# jQuery.wikilookup
jQuery.wikilookup is a configurable jQuery extension that enables you to add quick information from Wikipedia and other wikis.

## Use the plugin
To use jQuery.wikilookup, include it in your page:
```
	<script src="../dist/jquery.wikilookup-1.0.0.js"></script>
	<link rel="stylesheet" href="jquery.wikilookup-1.0.0.min.css">
```
Call the plugin on the DOM element that holds your text.
```$( '.content').wikilookup();```

By default, the plugin looks for elements tagged by `data-wikilookup` property.

You can change that property by providing an alternative selector:
```$( '.content').wikilookup( { selector: '.someClass' } );```

# Demo
For information about the configuration, [visit the demo page](https://mooeypoo.github.io/jquery.wikilookup/).

# Contribute and help!
jQuery.Wikilookup is an open source project. Please feel free to submit issues and/or pull requests.

# Author
Developed by Moriel Schottlender
