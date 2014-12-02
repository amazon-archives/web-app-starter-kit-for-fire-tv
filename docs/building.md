Build notes
===========

This project includes files to automate build tasks (combining/minifying js and generating css) using node, npm, and gulp.

Why build?
----------

* Combining all JS into a single file saves ~200ms (Amazon Mobile wifi) of download time, presumably due to just a single .js file instead of several.
* Minification of the JS saves ~50ms (FireTV) presumably a combination of smaller download and less parsing
* SASS allows the stylsheets to be described at a high level and produce a single .css file.
* inlining the .css saves ~10 msec, inlining the .js saves ~100 msec over separate files
* .map files allow Chrome devtools to show the original .scss sources and the unminified .js as individual files when debugging.


Prerequisites
-------------
If you've never used node/npm before please start here: http://nodejs.org/.  The default download of node includes npm, so if you use the prebuilt installer you'll be all set.  You don't really need to know much about node to run the build tasks.

If you've never used gulp before, please start here: https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md.  You don't need to know much about gulp, though.  TL;DR: just do this:
<code><pre>
npm install -g gulp
</pre></code>
(you might need to use 'sudo' with that, depending on how you installed node)

Building
----------------
OK, now that you've got both node/npm and gulp installed globally, next install all the dependencies for this project (see `package.json` for the list)
<code><pre>
npm install
</pre></code>

Run the gulp default task to generate the css and combined/minified JS (see `gulpfile.js`):
<code><pre>
gulp
</pre></code>

Other supported tasks

*	**concat**: makes build/all.js (and all.js.map) by concatenating the libs and template .js into one
<code><pre>
gulp concat
</pre></code>
*	**minify**: makes build/all.min.js (and all.min.js.map) by running uglify on all the needed .js files
<code><pre>
gulp minify
</pre></code>
*	**sass**: make css/firetv.css (and firetv.css.map) by compiling the firetv.scss and includes
<code><pre>
gulp sass
</pre></code>
*	**inline**: embed contents of &lt;link&gt; and &lt;script&gt; tags with `inline` attribute into build/index.html
<code><pre>
gulp inline
</pre></code>

* **watch** - .scss files for changes and rebuild, run it in the background
<code><pre>
gulp watch &
</pre></code>

* **watch-production** - watches the .scss  and js files files for changes and rebuild/minify/concat, run it in the background
<code><pre>
gulp watch-production &
</pre></code>

* **create-production**: compiles sass, minifies and concats all javascript, and updates index.html to use minified javascript, and puts everything in the /build directory including copying all assets over. This creates a servable production template
<code><pre>
gulp create-production
</pre></code>

