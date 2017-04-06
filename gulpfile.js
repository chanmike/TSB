var gulp = require('gulp');
var tslint = require('gulp-tslint');
var ts = require('gulp-typescript');
var runSequence = require('run-sequence');
var karma = require("gulp-karma");

var browserify  = require('browserify'),
    transform   = require('vinyl-transform'),
    uglify      = require('gulp-uglify'),
    sourcemaps  = require('gulp-sourcemaps');

//function that will convert Node stream to Gulp stream
var browserified = transform(function(filename) {
  var b = browserify({ entries: filename, debug: true });
  return b.bundle();
});

var tsProject = ts.createProject({
  removeComments: true,
  noImplicitAny: true,
  target: 'ES3',
  module: 'commonjs',
  declarationFiles: false
});

var tsTestProject = ts.createProject({
    removeComments : true,
    noImplicitAny : true,
    target : 'ES3',
    module : 'commonjs',
    declarationFiles : false
});

gulp.task('bundle-js', function () {
  return gulp.src('./temp/source/js/main.js')
             .pipe(browserified)
             .pipe(sourcemaps.init({ loadMaps: true }))
             .pipe(uglify())
             .pipe(sourcemaps.write('./'))
             .pipe(gulp.dest('./dist/source/js/'));
});

gulp.task('bundle-test', function () {
  return gulp.src('./temp/test/**/**.test.js')
             .pipe(browserified)
             .pipe(gulp.dest('./dist/test/'));
});

gulp.task('default', function(cb) {
  runSequence(
    'lint',                      // lint
    ['tsc', 'tsc-tests'],        // compile
    ['bundle-js','bundle-test'], // optimize
    'karma',                      // test
    'browser-sync',              // serve
    cb                           // callback
  );
});

gulp.task('karma', function(cb) {
  gulp.src('./dist/test/**/**.test.js')
      .pipe(karma({
         configFile: 'karma.conf.js',
         action: 'run'
       }))
       .on('end', cb)
       .on('error', function(err) {
         // Make sure failed tests cause gulp to exit non-zero
         throw err;
       });
});

gulp.task('lint', function () {
  return gulp.src([
    './source/ts/**/**.ts', './test/**/**.test.ts'
  ]).pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('tsc', function () {
  return gulp.src('./source/ts/**/**.ts')
    .pipe(ts(tsProject))
    .js.pipe(gulp.dest('./temp/source/js'));
});

gulp.task('tsc-tests', function() {
  return gulp.src('./test/**/**.test.ts')
             .pipe(ts(tsTestProject ))
             .js.pipe(gulp.dest('./temp/test/'));
});

gulp.task('bundle', function(cb) {
  runSequence('build', [
    'bundle-js', 'bundle-test'
  ], cb);
});

gulp.task('test', function(cb) {
  runSequence('bundle', ['karma'], cb);
});

gulp.task('browser-sync', ['test'], function() {
  var browserSync = require('browser-sync');
  browserSync({
    server: {
      baseDir: "./dist"
    }
  });

  return gulp.watch([
    "./dist/source/js/**/*.js",
    "./dist/source/css/**.css",
    "./dist/test/**/**.test.js",
    "./dist/data/**/**",
    "./index.html"
  ], [browserSync.reload]);
});