var gulp = require('gulp');
var clean = require('gulp-clean');
var rename = require('gulp-rename');

gulp.task('del', (done) => {
	return gulp.src('./build/settings_example.js', {read: false})
		.pipe(clean());
		done();
});

gulp.task('rename', (done) => {
	return gulp.src('./build/settings_example.js')
		.pipe(rename('settings.js'))
		.pipe(gulp.dest('./build'));
		done();
});

gulp.task('build', gulp.parallel(
	'rename', 'del'
));
