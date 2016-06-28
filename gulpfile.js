var gulp = require('gulp')
var yargs = require('yargs').argv
var config = require('./gulp.config')
var browserSync = require('browser-sync').create()
var browserify = require('browserify')
var watchify = require('watchify')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var babelify = require('babelify')
var del = require('del')
var $ = require('gulp-load-plugins')({
  lazy: true,
  rename: {
    'gulp-clean-css': 'cssmin'
  }
})

// add costum browserify options
var b = browserify({
  entries: config.globs.mainjs,
  debug: true,
  cache: {},
  packageCache: {},
  plugin: [watchify]
})

b.transform(babelify, {presets: ['es2015']})
b.on('update', bundle)

/**
 * @task {js} transform es6 to es5 and restart browserSync on changes
 */
gulp.task('js', bundle)

function bundle () {
  log('Bundling app.js to main.js!')

  var bundleStream = b.bundle()
  return bundleStream
    .on('error', logError)
    .pipe(source('main.js'))
    .pipe(buffer())
    // load maps from browserify, thanks to 'debug: true'
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sourcemaps.write('./maps/'))
    .pipe(gulp.dest('./src/js/'))
    .pipe(browserSync.reload({stream: true}))
}

/**
 * @task {build} Ship the source code into build
 */
gulp.task('build:clean', function (done) {
  del('./build/')
  done()
})

gulp.task('compressHTML', function () {
  return gulp
    .src('./build/*.html')
    .pipe($.htmlmin({
      removeComments: true,
      removeCommentsFromCDATA: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeOptionalTags: true,
      removeEmptyElements: true
    }))
    .pipe(gulp.dest('./build/'))
}
)

gulp.task('compressImages', function (done) {
  return gulp
    .src(config.globs.allimgs)
    .pipe($.imagemin({optimizationLevel: 7}))
    .pipe(gulp.dest('./build/imgs/'))
})

gulp.task('buildWithRev', function () {
  var jsFilter = $.filter('**/*.js', {restore: true})
  var cssFilter = $.filter('**/*.css', {restore: true})

  return gulp
    .src('./src/*.html')
    .pipe($.useref())
    // compress JS
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore)

    // compress CSS
    .pipe(cssFilter)
    .pipe($.cssmin({
      advanced: true,
      aggressiveMerging: true,
      keepSpecialComments: 0,
      processImport: true
    }))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', '> 5%'],
      cascade: false
    }))
    .pipe(cssFilter.restore)

    .pipe($.rev())
    .pipe($.revReplace())
    .pipe(gulp.dest('./build/'))
})

/**
 * @task {watch} watch all html and css file on change
 */
gulp.task('watch', function () {
  browserSync.init({server: './src/'})
  gulp
    .watch([config.globs.allcss, config.globs.allhtml])
    .on('change', browserSync.reload)
})

gulp.task('dev', gulp.parallel('js', 'watch'))

gulp.task('build',
  gulp.series(
    'build:clean',
    'buildWithRev',
    gulp.parallel('compressHTML', 'compressImages')
  )
)

/**
 * log messages to the console
 * @param  {string, object} msg the message that will be logged
 */
function log (msg) {
  if (typeof msg === 'object') {
    var inBlue = $.util.colors.blue

    for (var prop in msg) {
      if (msg.hasOwnProperty(prop)) {
        $.util.log(inBlue(prop) + ': ' + msg[prop])
      }
    }
  } else {
    $.util.log(msg)
  }
}

/**
 * pop a bubble including the error line and the file name
 * @param  {object} err the error object that will be logged
 */
function logError (err) {
  var lineNumber = err.loc.line
  var fileName = getFileName(err.filename)

  $.notify({tite: 'Error'}).write(lineNumber + ': ' + fileName)
  this.emit('end')
}

/**
 * Get the file name from a given path
 * @param  {string} path the URI path
 * @return {string}      the name of your file
 */
function getFileName (path) {
  var chunks = path.split('/')
  var lastChunkIndex = chunks.length - 1

  return chunks[lastChunkIndex]
}