'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _fs = require('fs');

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

var _os = require('os');

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
  var path = _ref.path,
      configPath = _ref.configPath,
      config = _ref.config,
      verbose = _ref.verbose;

  var DEFAULT_OUTPUT_PATH = (0, _os.tmpdir)();

  var webPackPath = require.resolve('webpack/bin/webpack');
  var rnd = new Date().getTime() + '_' + Math.round(1000000 * Math.random());
  var outPath = (0, _path.join)(config.output && config.output.path || DEFAULT_OUTPUT_PATH, '.webpack.res.' + rnd + '.js');

  // I need to run webpack via execSync because I have not found the way how to run
  // babel visitors asynchronously or run webpack compile synchronously
  var webPackStdOut = (0, _child_process.execSync)(['node', // for windows support
  webPackPath, configPath, path, outPath, '--bail'].join(' '));

  if (verbose) {
    console.error( // eslint-disable-line
    _safe2.default.blue('Webpack stdout for ' + path + '\n') + // eslint-disable-line prefer-template
    _safe2.default.blue('---------\n') + (webPackStdOut + '\n') + _safe2.default.blue('---------'));
  }

  var webPackResult = (0, _fs.readFileSync)(outPath, { encoding: 'utf8' });
  _rimraf2.default.sync(outPath);

  return webPackResult;
};