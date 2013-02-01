/*
 * grunt-reduce
 * https://github.com/munter/grunt-reduce
 *
 * Copyright (c) 2012 Peter Müller
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {

    grunt.registerTask('reduce', 'Description', function () {
        var done = this.async();

        var AssetGraph = require('assetgraph-builder'),
            query = AssetGraph.query,
            urlTools = require('assetgraph-builder/node_modules/assetgraph/lib/util/urlTools');

        var config = grunt.config(this.name) || {},
            rootUrl = urlTools.fsDirToFileUrl(config.root || 'app'),
            outRoot = urlTools.fsDirToFileUrl(config.outRoot || 'dist'),
            cdnRoot = config.cdnRoot && urlTools.ensureTrailingSlash(config.cdnRoot),
            cdnOutRoot = config.cdnOutRoot && urlTools.fsDirToFileUrl(config.cdnOutRoot),
            optimizeImages = config.optimizeImages === false ? false : true,
            less = config.less === false ? false : true,
            asyncScripts = config.asyncScripts === false ? false : true;

        var loadAssets = [
            '**/*.html',
            '**/.htaccess',
            '*.txt',
            '*.ico'
        ];

        if (config.include) {
            loadAssets = loadAssets.concat(config.include);
        }

        /*
            Hack to prevent AssetGraph from mangling template tags (particularly Mustache partials {{>partial}})
            Can be turned on with eg: {fixTemplateTags: '{{ }}'}

            Angle brackets within the tag are escaped prior to starting AssetGraph then replaced after in the source and build
        */
        var returnTemplateTags = function () {
            done();
        };

        if (config.fixTemplateTags) {
            if (typeof config.fixTemplateTags !== 'string' ||
                config.fixTemplateTags.indexOf(' ') <= 0 ||
                config.fixTemplateTags.indexOf(' ') === config.fixTemplateTags.length - 1) {
                throw new Error('fixTemplateTags option must be a string of the tag delimiters eg: \'{{ }}\'');
            }

            if (config.cdnRoot || config.cdnOutRoot) {
                throw new Error('The fixTemplateTags option is not compatible with cdnRoot or cdnOutRoot');
            }

            var templatePaths = [];
            var path = require('path');
            var root = config.root || 'app';
            var outRootRelative = config.outRoot || 'dist';
            var tags = config.fixTemplateTags.split(' ');
            var open = tags[0].trim();
            var close = tags[1].trim();
            var stripRe = new RegExp(open + '.*?' + close, 'g');
            var returnRe = new RegExp('#!#(.*?)\\/#!#', 'g');
            var stripHTML = function (str) {
                str = str.replace(/\>/g, '&gt;');
                str = str.replace(/</g, '&lt;');
                str = '#!#' + str + '/#!#';

                return str;
            };
            var returnHTML = function (str) {
                str = str.replace(/&gt;/g, '>');
                return str.replace(/&lt;/g, '<');
            };

            var templateFiles = [];
            loadAssets.forEach(function (pattern) {
                templateFiles = templateFiles.concat(grunt.file.glob.sync(pattern, {
                    cwd: root
                }));
            });

            templateFiles.forEach(function (file) {
                var src = grunt.file.read(path.join(root, file));

                src = src.replace(stripRe, function (match) {
                    return stripHTML(match);
                });
                grunt.file.write(path.join(root, file), src);
            });

            returnTemplateTags = function () {
                var writeTags = function (file) {
                    var src = grunt.file.read(file);

                    src = src.replace(returnRe, function (match, p1) {
                        return returnHTML(p1);
                    });
                    grunt.file.write(file, src);
                };
                templateFiles.forEach(function (file) {
                    writeTags(path.join(root, file));
                    writeTags(path.join(outRootRelative, file));
                });

                done();
            };
        }


        new AssetGraph({ root: rootUrl })
            .on('afterTransform', function (transform, elapsedTime) {
                console.log((elapsedTime / 1000).toFixed(3) + " secs: " + transform.name);
            })
            .on('warn', function (err) {
                // These are way too noisy
                if (err.relationType !== 'JavaScriptCommonJsRequire') {
                    console.warn((err.asset ? err.asset.urlOrDescription + ': ' : '') + err.message);
                }
            })
            .on('error', function (err) {
                console.error((err.asset ? err.asset.urlOrDescription + ': ' : '') + err.stack);
            })
            .registerRequireJsConfig()
            .loadAssets(loadAssets)
            .buildProduction({
                less: less,
                jpegtran: optimizeImages,
                pngquant: optimizeImages,
                pngcrush: optimizeImages,
                optipng: optimizeImages,
                inlineSize: config.inlineSize === 0 ? 0 : (config.inlineSize || 4096),
                manifest: config.manifest || false,
                asyncScripts: asyncScripts,
                cdnRoot: cdnRoot,
                noCompress: config.pretty || false
            })
            .writeAssetsToDisc({url: /^file:/}, outRoot)
            .if(cdnRoot)
                .writeAssetsToDisc({url: query.createPrefixMatcher(cdnRoot)}, cdnOutRoot || outRoot, cdnRoot)
            .endif()
            .writeStatsToStderr()
            .run(returnTemplateTags);
    });
};
