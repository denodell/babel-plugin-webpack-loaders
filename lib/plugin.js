'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (_ref4) {
  var t = _ref4.types;

  return {
    visitor: {
      CallExpression: function CallExpression(path, _ref5) {
        var filenameRelative = _ref5.file.opts.filenameRelative,
            _ref5$opts = _ref5.opts;
        _ref5$opts = _ref5$opts === undefined ? {} : _ref5$opts;
        var _ref5$opts$config = _ref5$opts.config,
            configPath = _ref5$opts$config === undefined ? './webpack.config.js' : _ref5$opts$config,
            _ref5$opts$verbose = _ref5$opts.verbose,
            verbose = _ref5$opts$verbose === undefined ? true : _ref5$opts$verbose,
            _ref5$opts$skipJs = _ref5$opts.skipJs,
            skipJs = _ref5$opts$skipJs === undefined ? true : _ref5$opts$skipJs;

        // don't process current plugin
        if (typeof getEnhancedResolver === 'undefined') {
          return;
        }

        var _path$node = path.node,
            calleeName = _path$node.callee.name,
            args = _path$node.arguments;


        if (calleeName !== 'require' || !args.length || !t.isStringLiteral(args[0])) {
          return;
        }

        // support env var interpolation into configPath
        var compiledConfigPath = (0, _template2.default)(configPath)(process.env);
        var config = compiledConfigPath === configPath ? localInteropRequire((0, _path.resolve)(process.cwd(), compiledConfigPath)) : localInteropRequire((0, _path.resolve)(compiledConfigPath));

        if (typeof config === 'function') {
          config = config();
        }

        if (Object.keys(config).length === 0) {
          // it's possible require calls inside webpack config or bad config
          return;
        }

        if (process.env.BABEL_DISABLE_CACHE !== '1') {
          warn('babel-plugin-webpack-loader:\nTo avoid caching errors you need to set BABEL_DISABLE_CACHE=1 environment variable.\nMore information at issue #36');
        }

        var _args = _slicedToArray(args, 1),
            originalFilePath = _args[0].value;

        var parts = originalFilePath.split('!');
        var filePath = parts.pop();
        var loaders = parts.join('!');

        if (loaders) {
          loaders += '!';
        }

        // to support babel builds (babel-node works fine)
        var filenameAbs = (0, _path.resolve)(filenameRelative);

        var resolver = getEnhancedResolver(config);

        var fileAbsPath = resolveFilePath(resolver, filenameAbs, filePath);

        if (!fileAbsPath) {
          return;
        }

        // for js and jsx files inside resolve.modules,
        // for absolute folders only i.e. `path.join(__dirname, 'resolveDir')`
        // replace require('xxx') to relative path i.e. `require('../resolveDir/xxx')`
        if (isJSFile(fileAbsPath) && !isRelativePath(filePath) && isInAbsResolveModulesPath(config)(fileAbsPath)) {
          var relPath = function (p) {
            return isRelativePath(p) ? p : './' + p;
          }((0, _path.relative)((0, _path.dirname)(filenameAbs), fileAbsPath));

          // path.replaceWith(t.stringLiteral(relPath));
          path.get('arguments.0').replaceWith(t.stringLiteral(relPath));
          return;
        }

        if (config.module.rules.some(function (l) {
          return l.test.test(filePath) || l.test.test(fileAbsPath);
        })) {
          if (isJSFile(fileAbsPath) && skipJs) {
            // js and jsx files in loaders is unsupported by webpack-loader plugin.
            // all babel settings in loader will be skipped`
            return;
          }

          var webPackResult = (0, _runWebPackSync2.default)({
            path: loaders + fileAbsPath,
            configPath: compiledConfigPath,
            config: config,
            verbose: verbose
          });

          var expr = processWebPackResult(webPackResult, config);

          if (expr !== null) {
            if (expr.type === 'FunctionExpression') {
              path.remove();
            } else {
              path.replaceWith(expr);
            }
          } else {
            path.remove();
          }
        }
      }
    }
  };
};

var _path = require('path');

var _enhancedResolve = require('enhanced-resolve');

var _babylon = require('babylon');

var _template = require('lodash/template');

var _template2 = _interopRequireDefault(_template);

var _babelTraverse = require('babel-traverse');

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

var _runWebPackSync = require('./runWebPackSync');

var _runWebPackSync2 = _interopRequireDefault(_runWebPackSync);

var _memoize = require('./memoize');

var _memoize2 = _interopRequireDefault(_memoize);

var _babelTypes = require('babel-types');

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var processWebPackResult = function processWebPackResult(webPackResult) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$output = _ref.output;

  _ref$output = _ref$output === undefined ? {} : _ref$output;
  var _ref$output$publicPat = _ref$output.publicPath,
      publicPath = _ref$output$publicPat === undefined ? '' : _ref$output$publicPat;

  var webpackResultAst = (0, _babylon.parse)(webPackResult);
  var expr = null;

  // without ExtractTextPlugin css-loader result looks like `blabla.locals = {...blbala}`
  (0, _babelTraverse2.default)(webpackResultAst, {
    FunctionExpression: function FunctionExpression(pathFn) {
      if (pathFn.node.params.length >= 2 && pathFn.node.params[1].name === 'exports') {
        pathFn.traverse({
          AssignmentExpression: function AssignmentExpression(path) {
            if (path.node.left.property && path.node.left.property.name === 'locals') {
              expr = path.node.right;
            }
          }
        });
      }
    }
  });

  // with ExtractTextPlugin css-loader result looks like `module.exports = {...blbala}`
  if (expr === null) {
    (0, _babelTraverse2.default)(webpackResultAst, {
      FunctionExpression: function FunctionExpression(pathFn) {
        if (pathFn.node.params.length >= 2 && pathFn.node.params[1].name === 'exports') {
          pathFn.traverse({
            AssignmentExpression: function AssignmentExpression(path) {
              if (path.node.left.property && path.node.left.property.name === 'exports') {
                expr = path.node.right;
              }
            },
            BinaryExpression: function BinaryExpression(pathBin) {
              pathBin.traverse({
                MemberExpression: function MemberExpression(pathM) {
                  if (pathM.node.object.name === '__webpack_require__' && pathM.node.property.name === 'p') {
                    pathM.replaceWith((0, _babelTypes.StringLiteral)(publicPath)); // eslint-disable-line
                  }
                }
              });
            }
          });
        }
      }
    });
  }

  return _babelTraverse2.default.removeProperties(expr);
};

// memoize resolver instance
var getEnhancedResolver = (0, _memoize2.default)(function (_ref2) {
  var configResolve = _ref2.resolve;
  return _enhancedResolve.ResolverFactory.createResolver(_extends({
    fileSystem: new _enhancedResolve.SyncNodeJsInputFileSystem()
  }, configResolve, configResolve && (configResolve.modules || configResolve.modulesDirectories) && {
    modules: [].concat(_toConsumableArray(configResolve.modules || []), _toConsumableArray(configResolve.modulesDirectories || []))
  }));
});

var localInteropRequire = function localInteropRequire(path) {
  require('babel-register');
  var res = require((0, _path.resolve)(process.cwd(), path));
  if ('default' in res) {
    return res.default;
  }
  return res;
};

// https://github.com/webpack/node-libs-browser
var internalNodeModules = {
  assert: 1,
  buffer: 1,
  child_process: 1,
  cluster: 1,
  console: 1,
  constants: 1,
  crypto: 1,
  dgram: 1,
  dns: 1,
  domain: 1,
  events: 1,
  fs: 1,
  http: 1,
  https: 1,
  module: 1,
  net: 1,
  os: 1,
  path: 1,
  process: 1,
  punycode: 1,
  querystring: 1,
  readline: 1,
  repl: 1,
  stream: 1,
  string_decoder: 1,
  sys: 1,
  timers: 1,
  tls: 1,
  tty: 1,
  url: 1,
  util: 1,
  vm: 1,
  zlib: 1
};

var resolveFilePath = function resolveFilePath(resolver, filenameAbs, filePath) {
  try {
    return resolver.resolveSync({}, (0, _path.dirname)(filenameAbs), filePath);
  } catch (e) {
    if (!(filePath in internalNodeModules)) {
      throw e;
    }
  }
  return undefined;
};

var isInAbsResolveModulesPath = (0, _memoize2.default)(function (_ref3) {
  var _ref3$resolve = _ref3.resolve;
  _ref3$resolve = _ref3$resolve === undefined ? {} : _ref3$resolve;
  var _ref3$resolve$modules = _ref3$resolve.modules,
      modules = _ref3$resolve$modules === undefined ? [] : _ref3$resolve$modules,
      _ref3$resolve$modules2 = _ref3$resolve.modulesDirectories,
      modulesDirectories = _ref3$resolve$modules2 === undefined ? [] : _ref3$resolve$modules2;

  // support only absolute pathes in resolve.modules for js and jsx files
  // because node_modules aliasing is a bad practice
  var absPathes = [].concat(_toConsumableArray(modules), _toConsumableArray(modulesDirectories)).filter(function (p) {
    return p === (0, _path.resolve)(p);
  });

  return function (fileAbsPath) {
    return absPathes.some(function (p) {
      return fileAbsPath.indexOf(p) === 0;
    });
  };
});

var isJSFile = function isJSFile(fileAbsPath) {
  var test = /\.jsx?$/;
  return test.test(fileAbsPath);
};

var isRelativePath = function isRelativePath(fileAbsPath) {
  return fileAbsPath.indexOf('.') === 0;
};

var warn = function () {
  var msgs = {};

  return function (message) {
    if (message in msgs) {
      return;
    }

    msgs[message] = true;

    console.error( // eslint-disable-line
    _safe2.default.yellow(message));
  };
}();