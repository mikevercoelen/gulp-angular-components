var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var path = require('path');
var applySourceMap = require('vinyl-sourcemaps-apply');
var PluginError = gutil.PluginError;

var camelCase = require('camelcase');
var upperCamelCase = require('uppercamelcase');

var PLUGIN_NAME = 'gulp-angular-components';

function isWindows () {
  return process.platform.match(/^win/);
}

function getIIFEHeader () {
  return "(function () {\n";
}

function getIIFEFooter () {
  return "})();";
}

var angularComponentExtensions = {
  route: '.route.js',
  config: '.config.js',
  controller: '.controller.js',
  directive: '.directive.js',
  run: '.run.js',
  constant: '.constant.js',
  filter: '.filter.js',
  factory: '.factory.js',
  service: '.service.js'
};

var gulpAngularComponents = function gulpAngularComponents (options) {
  var moduleName = options.moduleName;
  var addIIFE = options.addIIFE;

  return through.obj(function (file, encoding, callback) {

    // check if the file exists
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    // we don't support Streaming
    if (file.isStream()) {
      return this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming is not supported'));
    }

    // windows: replace front slash
    var filePath = file.path.replace(file.base, '');

    // windows: normalize platform slashes
    if (isWindows()) {
      filePath = fileName.replace(/\\/g, '/');
    }

    // enable sourcemaps
    // if (file.sourceMap) {
    //   options.makeSourceMaps = true;
    // }

    var newContentString = file.contents.toString();
    var footer = (addIIFE === true) ? getIIFEFooter() : '';
    var matches = /([^\/.\s]+)\.([^\/.\s]+)(\.[^\/\s]+)$/g.exec(filePath);

    if (matches.length !== 4) {
      return errorMessage('Could not parse component file: ' + filePath);
    }

    var fileName = matches[0]; // "main.run.js"
    var strippedFileName = matches[1]; // "main"
    var type = matches[2]; // "route"
    var extension = matches[3]; // ".js"

    var componentExtension = angularComponentExtensions[type];
    var moduleWrap = "angular.module('" + moduleName + "')";
    var functionName = camelCase(path.basename(fileName, componentExtension));
    var parameter = '';

    switch (type) {

      // angular.module('demo').controller('DashboardController', DashboardController);
      case 'controller':
        functionName = upperCamelCase(functionName) + 'Controller';
        parameter = "'" + functionName + "', ";
        break;

      // angular.module('demo').factory('users', users);
      // angular.module('demo').directive('docs', docs);
      // angular.module('demo').constant('config', config);
      // angular.module('demo').filter('date', date);
      case 'factory':
      case 'service':
      case 'directive':
      case 'constant':
      case 'filter':
        parameter = "'" + functionName + "', ";
        break;

      // angular.module('demo').config(route);
      // angular.module('demo').run(run)
      // angular.module('demo').config(config);
      case 'route':
      case 'run':
      case 'config':
        break;
      default:
        return this.emit('error', new PluginError(PLUGIN_NAME, 'Unsupported component with type ' + type + ' (' + fileName + ')'));
      break;
    }

    var header =
      moduleWrap + '.' + // angular.module('demo').
      type + '(' + // .config(
      parameter + // '' OR 'DashboardController, '
      functionName + ');'; // 'DashboardController);'

    gutil.log(gutil.colors.white('Rendering component: ') + gutil.colors.green(fileName) + ' ' + gutil.colors.gray(header));

    if (addIIFE) {
      header = getIIFEHeader() + header;
    }

    newContentString = header + newContentString + footer;
    file.contents = new Buffer(newContentString);

    // if (file.sourceMap) {
    //   applySourceMap(file, map);
    // }

    this.push(file);
    callback();
  });
}

module.exports = gulpAngularComponents;
