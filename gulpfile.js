/*
Automation of common build tasks.

Gulp requires node and npm (node package manager), if you've never used node/npm before please start here: http://nodejs.org/

If you've never used gulp before, please start here: https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md

Assuming you've got both node/npm and gulp installed globally, do this:

install all the dependencies for this project (see package.json for the list):
    npm install

run the gulp default task to generate the css and combined/minified JS (see the 'default' task):
    gulp

Other supported tasks:
    gulp concat - makes build/all.js (and all.js.map) by concatenating the libs and template .js files into one
    gulp minify - makes build/all.min.js (and all.min.js.map) by running uglify on all the needed .js files
    gulp sass - make css/firetv.css (and firetv.css.map) by compiling the firetv.scss and includes
    gulp inline - embed contents of <link> and <script> tags with 'inline' attribute into html
    gulp watch & - start a background task to watch the .js and .scss files for changes and rebuild
    gulp deploy - uses rsync to push needed sources to a server, uses DEPLOY_HOST and DEPLOY_PATH environment vars

*/

var gulp = require('gulp');
var concat = require('gulp-concat-sourcemap');
var uglify = require('gulp-uglifyjs');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var rsync = require('gulp-rsync');
var inlinesource = require('gulp-inline-source');
var htmlreplace = require('gulp-html-replace');
//var debug = require('gulp-debug');

var assets =  [
    'images/icon_leftnav_arrowDown.png',
    'images/bg_app.jpg',
    'images/btn_pause.png',
    'images/img_logo.png', 
    'assets/**/*',
    'css/**/*'
];

var libSources = [
    "libs/jquery.js",
    "libs/handlebars-v1.3.0.js"
];

var appSources = [
    "js/util.js",
    "js/button-view.js",
    "js/events.js",
    "js/buttons.js",
    "js/leftnav-view.js",
    "js/one-d-view.js",
    "js/shoveler-view.js",
    "js/model.js",
    "js/app.js",
    "js/player-view.js"
];

var html = [
    'index.html'
];

var jsSources = libSources.concat(appSources);

gulp.task('default', ['sass']);
gulp.task('create-production', ['sass', 'concat', 'minify', 'copy-assets', 'create-html']);

gulp.task('copy-assets', function() {
    return gulp.src(assets, {base:"."})
        .pipe(gulp.dest('./build/'));
});

gulp.task('create-html', function() {
    return gulp.src('index.html').pipe(htmlreplace({'js': 'all.min.js'
    })).pipe(gulp.dest('./build/'));
});

gulp.task('concat', function() {
    return gulp.src(jsSources)
        .pipe(concat('all.js', {sourceRoot: '..'}))
        //.pipe(debug({verbose: false}))
        .pipe(gulp.dest('./build/'));
});

gulp.task('minify', function() {
    return gulp.src(jsSources)
        .pipe(uglify('all.min.js', {sourceRoot:'..', outSourceMap: true}))
        //.pipe(debug({verbose: false}))
        .pipe(gulp.dest('./build/'));
});

gulp.task('sass', function() {
    return gulp.src('./*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass())
        //.pipe(debug({verbose: false}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./css'));
});

gulp.task('inline', ['sass', 'concat', 'minify'], function () {
    return gulp.src(html)
        .pipe(inlinesource())
        .pipe(gulp.dest('build/'));
});


gulp.task('watch-production', ['create-production'], function() {
    var jswatcher = gulp.watch(jsSources, ['concat','minify']);
    jswatcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type);
    });

    var sasswatcher = gulp.watch('./*.scss', ['sass']);
    sasswatcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type);
    });

    console.log('sass and javascript watchers started');
});

gulp.task('watch', ['sass'], function() {
    var sasswatcher = gulp.watch('./*.scss', ['sass']);
    sasswatcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type);
    });

    console.log('sass watchers started');
});




