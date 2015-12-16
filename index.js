var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var path = require('path');
var applySourceMap = require('vinyl-sourcemaps-apply');
var PluginError = gutil.PluginError;

var esprima = require('esprima');
var escodegen = require('escodegen');
var estemplate = require('estemplate');

var camelCase = require('camelcase');
var upperCamelCase = require('uppercamelcase');

var PLUGIN_NAME = 'gulp-angular-components';
var IIFE_HEADER = "(function () {\n";
var IIFE_FOOTER = "})();";

function isWindows () {
  return process.platform.match(/^win/);
}

var gulpAngularComponents = function gulpAngularComponents (options) {
  var moduleName = options.moduleName;
  var format = escodegen.FORMAT_DEFAULTS;

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

    function getComponentTemplate () {
      var content = file.contents.toString();
      var matches = /([^\/.\s]+)\.([^\/.\s]+)(\.[^\/\s]+)$/g.exec(filePath);
      var template = '';

      if (matches.length !== 4) {
        return errorMessage('Could not parse component file: ' + filePath);
      }

      var fileName = matches[0]; // "main.run.js"
      var strippedFileName = matches[1]; // "main"
      var type = matches[2]; // "route"
      var extension = matches[3]; // ".js"

      var componentExtension = '.' + type + '.js';
      var moduleWrap = "angular.module('" + moduleName + "')";
      var functionName = camelCase(path.basename(fileName, componentExtension));
      var parameter = '';

      // route type is a config angular element
      if (type === 'route') {
        type = 'config';
      }

      switch (type) {
        case 'controller':
          functionName = upperCamelCase(functionName) + 'Controller';
          parameter = "'" + functionName + "', ";
          break;
        case 'factory':
        case 'service':
        case 'directive':
        case 'constant':
        case 'filter':
          parameter = "'" + functionName + "', ";
          break;
        case 'run':
        case 'config':
          break;
        default:
          return this.emit('error', new PluginError(PLUGIN_NAME, 'Unsupported component with type ' + type + ' (' + fileName + ')'));
        break;
      }

      var templateHeader =
        moduleWrap + '.' + // angular.module('demo').
        type + '(' + // .config(
        parameter + // '' OR 'DashboardController, '
        functionName + ');'; // 'DashboardController); ... content '

      gutil.log(gutil.colors.white('Rendering component: ') + gutil.colors.green(fileName) + ' ' + gutil.colors.gray(templateHeader));

      if (type === 'constant') {
        template = '%= body %;' + templateHeader;
      } else {
        template = templateHeader + ' %= body %;';
      }

      return IIFE_HEADER + template + IIFE_FOOTER;
    }

    if (file.isBuffer()) {
      try {
        var componentTemplate = estemplate.compile(getComponentTemplate(), {
          attachComment: true
        });

        var ast = esprima.parse(file.contents, {
					loc: true,
					source: file.relative,
					range: true,
					tokens: true,
					comment: true
				});

        escodegen.attachComments(ast, ast.comments, ast.tokens);
        ast.file = file;

        ast = componentTemplate(ast);

        var result = escodegen.generate(ast, {
					comment: true,
					format: format,
					sourceMap: true,
					sourceMapWithCode: true,
					file: file.relative
				});

      } catch (e) {
        return this.emit('error', new PluginError(PLUGIN_NAME, file + ' ' + e.message));
      }
    }

    file.contents = new Buffer(result.code);

    if (file.sourceMap) {
      applySourceMap(file, JSON.parse(result.map.toString()));
    }

    this.push(file);
    callback();
  });
}

module.exports = gulpAngularComponents;
