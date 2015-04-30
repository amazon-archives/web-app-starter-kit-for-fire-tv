/*
Automation of common build tasks.

Gulp requires node and npm (node package manager), if you've never used node/npm before please start here: http://nodejs.org/

If you've never used gulp before, background is here: https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md,
tl;dr: just do this
    npm install -g gulp

Next, install all the dependencies for this project (see package.json for the list):
    npm install

Now you can run the gulp default task to copy all:
    gulp build

see what else you can do:
    gulp help

*/

var gulp = require('gulp-help')(require('gulp'), { description: 'Display this', aliases: ['h', '?'] });
var uglify = require('gulp-uglifyjs');
var sass = require('gulp-sass-binaries');
//var sourcemaps = require('gulp-sourcemaps');
var inlinesource = require('gulp-inline-source');
var htmlreplace = require('gulp-html-replace');
var debug = require('gulp-debug');
var merge = require('merge-stream');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var rename = require("gulp-rename");
var fs = require('fs');
var packageJSON = require('./package.json');
var template_info = '<!-- \n   Web App Starter Kit for Fire TV \n\n   Name: ' + packageJSON.name + '\n   Version: ' + packageJSON.version +
    '\n\n   https://github.com/amzn/web-app-starter-kit-for-fire-tv \n\n   The project is released as open source under the Creative Commons License CC0 \n\n   http://creativecommons.org/publicdomain/zero/1.0/\n-->';

var path = require('path');

// from https://github.com/gulpjs/gulp/blob/master/docs/recipes/using-external-config-file.md

var config = {};
var pathSettings = ["html", "sass", "assets", "root", "appJS", "libJS"];
var projectsPath = "./src/projects";
var projectDirs = fs.readdirSync(projectsPath);
for (var i = 0; i < projectDirs.length; i++) {
    var project = projectDirs[i];
    if (project[0] !== ".") {
        var configFile = projectsPath + '/' + project + '/build.json';
        if(fs.existsSync(configFile) == false){
            continue;
        }
        config[project] = require(configFile);
        if (!config[project].dest) {
            config[project].dest = "./out/" + project;
        }
        if (!config[project].appTitle) {
            config[project].appTitle = project;
        }
        // expand project paths
        for(var k in pathSettings){
            var setting = pathSettings[k];
            var paths = config[project][setting] ;
            for(var n in paths){
                paths[n] = path.resolve(projectsPath + "/" + project, paths[n])
            }
            config[project][setting]  = paths;
        }
        // console.log(config[project]);
    }
}

// MAIN TASKS

gulp.task('default', false, ['help']);

gulp.task('build', 'minimal build and copy (default) - ', ['copy-assets', 'copy-root', 'sass-css', 'copy-js', 'build-html'],
    function(){}, {aliases: ['b', 'debug', 'd']});
gulp.task('watch', 'execute the build task when any source file changes - ', ['copy-assets-watch', 'copy-root-watch', 'sass-css-watch', 'copy-js-watch', 'build-html-watch'],
    function(){}, {aliases: ['w']});

gulp.task('minify', 'generate html with minified js - ', ['copy-assets', 'copy-root', 'sass-css', 'minify-js', 'minify-html'],
    function(){}, {aliases: ['m']});
gulp.task('minify-watch', 'execute minify when any source file changes - ', ['copy-assets-watch', 'copy-root-watch', 'sass-css-watch', 'minify-js-watch', 'minify-html-watch']);

gulp.task('inline', 'minify js and inline it and css into final html - ', ['copy-assets', 'copy-root', 'sass-css', 'minify-js', 'inline-html'],
    function(){}, {aliases: ['i']});
gulp.task('inline-watch', 'execute inline when any source file changes - ', ['copy-assets-watch', 'copy-root-watch', 'sass-css-watch', 'minify-js-watch', 'inline-html-watch']);

// see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md
gulp.task('clean', 'remove all config.dest directories', forAllTargets(doClean), {aliases: ['c']});
function doClean(cfg) {
    return gulp.src(cfg.dest)
      .pipe(vinylPaths(del));
}

// UTILITY TASKS

// tasks to modify the target.html files to inline the .css and .js items into a single file, using minified js
gulp.task('build-html', false, forAllTargets(doBuildHTML));
gulp.task('build-html-watch', false, forAllTargetsWatch(getSrcHTML, ['build-html']));
function getSrcHTML(cfg) {
    return cfg.html;
}
function getInjectJSPaths(cfg) {
    var paths = getSrcJS(cfg);
    return paths.map(function(jsPath) {return 'js/'+jsPath.slice(jsPath.lastIndexOf(path.sep)+1)});
}
function doBuildHTML(cfg) {
    return gulp.src(getSrcHTML(cfg))
        .pipe(htmlreplace({
            js: getInjectJSPaths(cfg),
            template_info: template_info,
            app_title: cfg.appTitle}))
        //.pipe(debug({verbose: false}))
        .pipe(gulp.dest(cfg.dest));
}


// tasks to modify the target.html files to replace specifed sections with all.min.js, the result of the minify-js task
gulp.task('minify-html', false, ['minify-js'], forAllTargets(doMinifyHTML));
gulp.task('minify-html-nodeps', false, forAllTargets(doMinifyHTML));
gulp.task('minify-html-watch', false, forAllTargetsWatch(getSrcMinifyHTML, ['minify-html-nodeps']));
function doMinifyHTML(cfg) {
    return gulp.src(getSrcHTML(cfg), {base: cfg.source})
        .pipe(htmlreplace({
            js: {src: 'all.min.js', tpl: '<script src="%s"></script>'},
            template_info: template_info,
            app_title: cfg.appTitle}))
        .pipe(gulp.dest(cfg.dest));
}
function getSrcMinifyHTML(cfg) {
    return getSrcHTML(cfg).concat(cfg.dest + '/all.min.js');
}


// tasks to modify the target.html files to inline the .css and .js items into a single file, using minified js
gulp.task('inline-html', false, ['sass-css', 'minify-js'], forAllTargets(doInlineHTML));
gulp.task('inline-html-nodeps', false, forAllTargets(doInlineHTML));
gulp.task('inline-html-watch', false, forAllTargetsWatch(getInlineSrcHTML, ['inline-html-nodeps']));
function getInlineSrcHTML(cfg) {
    return getSrcHTML(cfg).concat([cfg.dest + '/all.min.js', cfg.dest + '/*.css']);
}
function doInlineHTML(cfg) {
    return gulp.src(getSrcHTML(cfg), {base: '.'})
        .pipe(rename({dirname: cfg.dest}))
        .pipe(htmlreplace({
            js: {src: 'all.min.js', tpl: '<script inline src="%s"></script>'},
            template_info: template_info,
            app_title: cfg.appTitle}))
        //.pipe(debug({verbose: false}))
        .pipe(inlinesource())
        .pipe(gulp.dest('.'));
}


// task to copy the js sources from target.libJS and target.appJS to the dest, for use when inline/minify not used
gulp.task('copy-js', false, forAllTargets(doCopyJS));
gulp.task('copy-js-watch', false, forAllTargetsWatch(getSrcJS, ['copy-js']));
function doCopyJS(cfg) {
    return gulp.src(getSrcJS(cfg))
        .pipe(rename({dirname: 'js'}))
        .pipe(gulp.dest(cfg.dest));
}


// task to run the gulp-uglify process on all target.libJS and target.appJS files, using target.uglifyOpts
gulp.task('minify-js', false, forAllTargets(doMinifyJS));
gulp.task('minify-js-watch', false, forAllTargetsWatch(getSrcJS, ['minify-js']));
function getSrcJS(cfg) {
    return cfg.libJS.concat(cfg.appJS);
}
function doMinifyJS(cfg) {
    return gulp.src(getSrcJS(cfg))
        .pipe(rename({dirname: 'js'}))
        .pipe(uglify('all.min.js', {
            "sourceRoot": ".",
            "outSourceMap": false
        }))
        //.pipe(debug({verbose: false}))
        .pipe(gulp.dest(cfg.dest));
}


// task to copy all assets named in target.assets to target.dest/assets directory
gulp.task('copy-assets', false, forAllTargets(doCopyAssets));
gulp.task('copy-assets-watch', false, forAllTargetsWatch(getSrcAssets, ['copy-assets']));
function getSrcAssets(cfg) {
    return cfg.assets || [];
}
function doCopyAssets(cfg) {
    return gulp.src(getSrcAssets(cfg))
        .pipe(rename({dirname: 'assets'}))
        .pipe(gulp.dest(cfg.dest));
}

// task to copy all files named in target.root to target.dest directory
gulp.task('copy-root', false, forAllTargets(doCopyRoot));
gulp.task('copy-root-watch', false, forAllTargetsWatch(getSrcRoot, ['copy-root']));
function getSrcRoot(cfg) {
    return cfg.root || [];
}
function doCopyRoot(cfg) {
    return gulp.src(getSrcRoot(cfg))
        .pipe(gulp.dest(cfg.dest));
}

// task to run sass processor on target.sass sources, putting result in target.dest directory
gulp.task('sass-css', false, forAllTargets(doSassCSS));
gulp.task('sass-css-watch', false, forAllTargetsWatch(getSrcSass, ['sass-css']));
function getSrcSass(cfg) {
    return cfg.sass;
}
function doSassCSS(cfg) {
    return gulp.src(cfg.sass)
        //.pipe(sourcemaps.init())
        .pipe(sass())
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(cfg.dest));
}



// HELPER FUNCTIONS

// see https://github.com/gulpjs/gulp/blob/master/docs/recipes/using-multiple-sources-in-one-task.md
// use merge-stream module to combine an array of 0 or more streams into a single stream, so gulp can
// properly wait until all streams in the set are complete.
// result is a merge of all non-falsy elements in the streams array, falsy elements are ignored
function mergeStreams(streams) {
    streams = streams.filter(function(e) {return !!e});
    if (!streams || streams.length == 0) {
        return;
    }
    if (streams.length == 1) {
        return streams[0];
    }
    var result = merge(streams[0], streams[1]);
    for (var i = 2; i < streams.length; i++) {
        result.add(streams[i]);
    }
    return result;
}

// returns a function that calls the doSomething function for each target and collects the results into a single stream
// the config target is passed to the doSomething callback, which is expected to return a stream or a falsy result if
// nothing was done
// This is called at init time when the tasks are defined, so it returns a function that will actually perform the task
// when needed, rather than performing it immediately.
function forAllTargets(doSomething) {
    return function() {
        var streams = [];
        for (var target in config) {
            streams.push(doSomething(config[target]));
        }
        return mergeStreams(streams);
    }
}

// returns a function that calls the passed getSources function for each target in the config and combines the results
// into a single array of sources for gulp.watch.  If any of the sources change, it executes the tasks specified by the
// tasks argument.
// Is called at init time when a task to create the watcher is defined, so it returns a function that will actually
// set up the watcher when the taks is invoked, rather than setting it up immediately.
function forAllTargetsWatch(getSources, tasks) {
    return function() {
        var src = [];
        for (var target in config) {
            src = src.concat(getSources(config[target]));
        }
        watcher = gulp.watch(src, tasks);
        watcher.on('change', function(event) {
            console.log('file ' + event.path + ' was ' + event.type);
        });
    }
}
