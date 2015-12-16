var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var path = require('path');
var applySourceMap = require('vinyl-sourcemaps-apply');

var PLUGIN_NAME = 'gulp-angular-components';

var gulpAngularComponents = function gulpAngularComponents (options, sync) {
  return through.obj(function (file, encoding, callback) {
    return callback(null, file);
  });
}

module.exports = gulpAngularComponents;
