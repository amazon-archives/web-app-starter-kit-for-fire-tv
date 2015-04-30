Build notes
===========

This project includes files to automate build tasks (moving asset files, combining/minifying JavaScript and generating CSS) using [Node](http://nodejs.org/), [NPM](https://www.npmjs.com), [Gulp](http://gulpjs.com/) and CSS templates written using [Sass](http://sass-lang.com/).

Why use a build system?
----------

* Sass allows the stylesheets to be modularized and customized per project.
* Minification and inlining of JavaScript and CSS saves both download and parsing time.
* Automatic creation of .map files allow Chrome DevTools to show the original .scss sources and the unminified .js as individual files when debugging.
* Multiple projects can be managed and updated more seamlessly.


Prerequisites
-------------

You need to first install Node/NPM and Gulp on your system - accessible globally -then install the build system support libraries to the directory where you cloned/downloaded the Starter Kit.

#### Step 1: Install Node/NPM Globally

To install **Node** and **NPM**, please start here: [http://nodejs.org/](http://nodejs.org/) and download the specific installer for your system. 

The default Node setup includes NPM (the Node Package Manager), so you shouldn't need to install it separately.

#### Step 2: Install Gulp Globally

To install **Gulp**, you need to open a terminal/console and use the `npm install` command with the `-g` global flag:
<code><pre>
$ npm install -g gulp
</pre></code>

***Unix/Mac** users: On most Unix systems such as Linux and OS X, you will need to use 'sudo' for the above command.*

***Windows** users: You will need to use NPM's gulp@3.8.8 package - other versions of Gulp may have issues.*

If you've never used Gulp before, you can check out the [Gulp Getting Started guide](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md), however in-depth knowledge of Gulp is not needed to use this build system.

#### Step 3: Install Local Build Support Files

Once Node/NPM and Gulp are installed globally, you will need to install all the build dependency files to the local project repository before you can use the build system. 

Open a terminal/console and change directories to where you cloned/downloaded the starter kit support, then run `npm install`. This will automatically pull all the libraries needed by the build system. 
<code><pre>
$ cd ./web-app-starter-kit-for-firetv/
$ npm install
</pre></code>

The specific libraries that will be installed are listed in the project's `package.json` npm package file. 

Building
----------------

The Gulp default task explains what other Gulp tasks are available

	$ gulp
	[12:08:24] Using gulpfile ~/work/web-app-starer-kit-for-fire-tv/gulpfile.js
	[12:08:24] Starting 'help'...
	
	Usage
	  gulp [task]
	
	Available tasks
	  build         minimal build and copy (default) Aliases: b, debug, d
	  clean         remove all config.dest directories Aliases: c
	  help          Display this Aliases: h, ?
	  inline        minify js and inline it and css into final html Aliases: i
	  inline-watch  execute inline when any source file changes
	  minify        generate html with minified js Aliases: m
	  minify-watch  execute minify when any source file changes
	  watch         execute the build task when any source file changes Aliases: w


#### Tasks

* **build** The basic debug build task will generate the final CSS from the .scss templates, copy the .js files to `out/<project>`, copy any asset files, and
insert the &lt;script&gt; tags for each .js file into index.html.  (see `gulpfile.js`):
<code><pre>
$ gulp build
</pre></code>


* **minify**: makes build/all.min.js (and all.min.js.map) by running uglify on all the needed .js files
<code><pre>
gulp minify
</pre></code>
* **watch** - sets up watchers for any changes to the src files and re-runs build steps on changes (run in background)
<code><pre>
gulp watch &
</pre></code>
* **minify-watch** - watches src files but runs minify build steps when they change
<code><pre>
gulp minify-watch &
</pre></code>
* **clean** - delete 'built' files in the out/ directories
<code><pre>
gulp clean
</pre></code>

Config files
----------------
Each project (directory in src/projects) has a `build.json` configuration file that describes that particular project.
Each entry in the configuration lists the files needed for one part of the build

* **dest** - optional, specifies output director, defaults to ./out/<em>project</em>, replace to write output files to another location
<code><pre>
    "dest" : "./example",
</pre></code>
* **appTitle** - optional, specifies app title to be used. The project directory name will be used if not specified.
<code><pre>
    "appTitle" : "Example",
</pre></code>
* **html** - the html source for the project, currently all projects share one common html wrapper
<code><pre>
    "html" : [
        "../../common/html/index.html"
    ],
</pre></code>
* **sass** - the .scss files for the project, currently each project has a different 'firetv'scss' file that @imports the
common files, the sass compiler does not yet support any kind of @import path modification or indirection.
<code><pre>
    "sass" : [
        "../../common/scss/*.scss",
        "firetv.scss"
    ],
</pre></code>
* **assets** - lists any other files that should be copied to the output directory
<code><pre>
    "assets" : [
        "../../common/images/icon_leftnav_arrowDown.png",
        ...
        "genericMediaData.json",
        "images/\*",
        "video/\*"
    ],
</pre></code>
* **appJS** - lists the .js files used in the project, either from common or project-specific locations
<code><pre>
    "appJS" : [
        "../../common/js/util.js",
        ...
        "init.js"
    ],
</pre></code>
* **libJS** - lists the library .js files used in the project
<code><pre>
    "libJS" : [
        "../../libs/jquery.js",
        "../../libs/handlebars-v1.3.0.js"
    ],
</pre></code>

Creating a new project
----------------
The easiest way create a new project is to copy the starter project directory that is closest to the one you want and modify it: 

1. Duplicate a starter project directory found in `src/projects/`
* Edit `build.json` with any new files and new app name
* Edit `init.js` and change/add any parameters needed
* Run `gulp build` and your new project will go in the `out/<your-project-name>`


