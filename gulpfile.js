var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var htmlmin = require('gulp-htmlmin');

// Handle configs
function configs() {
    return gulp.src('./src/js/configs/' + process.env.NODE_ENV + '.js')
        .pipe(rename('configs.js'))
        .pipe(gulp.dest('./src/js'));
}

// Handle JS Files
function scripts() {
    return gulp.src('src/js/*.js')
      .pipe(concat('all.js'))
      .pipe(rename('all.min.js'))
      .pipe(uglify())
      .pipe(gulp.dest('./build/js'));
}

// Handle my html
function html() {
    return gulp.src('./src/html/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('./build/html'));
}

function watch() {
    gulp.watch('./src/js/configs/*.js', configs);
    gulp.watch('./src/js/*.js', scripts);
    gulp.watch('./src/html/*.html', html);
}

// Default Task
gulp.task('default', gulp.series(configs, scripts, html, watch));
