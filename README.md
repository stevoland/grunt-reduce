# grunt-reduce

---
NOTE: This fork includes an option to prevent grunt-reduce from mangling template tags (particularly Mustache partials {{>partial}})

This option can be turned on with eg: {fixTemplateTags: '{{ }}'}

Angle brackets within the tag are escaped prior to starting AssetGraph then replaced after in the source and build)

This option is not compatible with cdnRoot or cdnOutRoot
---

A grunt kitchen that reduces your web ingredients down to their essence for optimal serving. Bon appétit!

grunt-reduce builds your web application based on the DOM.
This has a number of advantages to the developer:
* If the browser can see it, so can grunt-reduce - Develop for the browser not the build system!
* Minimal configuration needed
* No build system smells in your markup, javascript, css etc.
* It's fast! No intermediate files on disk

Compatible with grunt v0.3.x and v0.4.x

# Configuration

Minimal configuration:
``` javascript
module.exports = function( grunt ) {
  'use strict';

  grunt.initConfig({
    reduce: {
        root: 'app',
        outRoot: 'dist'
    }
  });

  grunt.loadNpmTasks('grunt-reduce');
};
```

Maximal configuration:
``` javascript
module.exports = function( grunt ) {
  'use strict';

  grunt.initConfig({
    reduce: {
        // Source folder
        root: 'app', // Default: 'app',

        // Build destination folder
        outRoot: 'dist', // Default: 'dist',

        // Root of your CDN. Optional
        //cdnRoot: 'https://my.amazon.s3.bucket',

        // minimatch patterns of files to include as base assets
        // Dependencies of these will be automatically populated
        // Paths are relative to reduce.root ('app')
        include: [
          '**/*.html',
          '**/.htaccess',
          '*.txt',
          '*.ico'
        ],

        // Compile less files and remove less.js from application
        less: true, // Default: true

        // Run all available jpeg and png optimizations on images
        // For maximum efficiency install jpegtran, optipng, pngcrush and pngquant
        optimizeImages: true, // Default: true

        // Create a cache manifest file
        // If one already exists it will be ammended with static assets
        manifest: false, // Default: false

        // Set the 'async'-attribute on all script tags
        asyncScripts: true, // Default: true

        // Pretty print assets. Good for debugging
        pretty: false, // Default: false

        // Inline CSS backgrounds below this byte threshold as data-uris
        // There will be an old IE fallback to the original image
        // 0 disables.
        inlineSize: 4096 // Default: 4096

        // Prevent manging of template tags (particularly Mustache
        // partials eg: {{>partial}} )
        fixTemplateTags: "{{ }}" // Default: false
    }
  });

  grunt.loadNpmTasks('grunt-reduce');
};
```

# Automated spriting
Even though most browsers support inlining images through data-uris, spriting is sometimes still needed.

grunt-reduce eases the pain of spriting considerably, down to a convenient little anotation in the image url of the images you want to sprite.

Say you have the following CSS:
``` CSS
.icon.calendar {
    background-image: url(icons/calendar.png);
}
.icon.email {
    background-image: url(icons/email.png);
}
.icon.contacts {
    background-image: url(icons/contacts.png);
}
```

Assuming all of these images are all smaller than 4k after minification grunt-reduce will inline them as data-uris. If what you really wanted was a sprite, you can do this instead:

``` CSS
.icon.calendar {
    background-image: url(icons/calendar.png?sprite=mySprite);
}
.icon.email {
    background-image: url(icons/email.png?sprite=mySprite);
}
.icon.contacts {
    background-image: url(icons/contacts.png?sprite=mySprite);
}
```

The build process will now generate an optimally packed sprite sheet for you, run that sprite sheet through lossless image optimization and replace the CSS image references with a reference to the generated sprite, including the sprite offset.

You may create several different sprite sheets by defining different sprite names in the sprite parameter.

When using this technique it is recommended to have a seperate dom element for each image with the same dimensions as the background image.

Note about data-uris: IE versions lower than 8 do not understand data-uris. grunt-reduce adds a fallback to get the original image using conditional comments for these old IE versions.


# Tools used
* Assetgraph: https://github.com/One-com/assetgraph
* Assetgraph-builder: https://github.com/One-com/assetgraph-builder
* Assetgraph-sprite: https://github.com/One-com/assetgraph-sprite


## License
Copyright (c) 2012 Peter Müller
Licensed under the MIT license.
