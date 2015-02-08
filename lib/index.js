'use strict';

var path = require('path');
var hoek = require('hoek');
var globule = require('globule');

var defaultOptions = {
  base: '.',
  coverageBase: '.',
  coverageExclude: [],
  exclude: [],
  output: process.stdout,
  paths: []
};

module.exports = function (options) {
  return new Runner(options);
};

var Runner = function (options) {
  options = this._options = hoek.applyToDefaultsWithShallow(defaultOptions,
      options, ['output']);

  var exclude = globule.find(options.exclude, {
    filter: 'isFile',
    srcBase: options.base
  }).map(function (pathname) {
    return '!' + pathname;
  });

  if (!options.paths.length) {
    options.paths.push('.');
  }

  this._paths =  hoek.flatten(this._expand(exclude));

  options.schedule = false;
  options.coverage = options.coverage || options.threshold > 0 ||
      options.reporter === 'html' || options.reporter === 'lcov' ||
      options.reporter === 'clover';
  options.coveragePath = path.resolve(options.coverageBase);

  options.coverageExclude = globule.find(options.coverageExclude, {
    filter: 'isFile',
    srcBase: options.coverageBase
  })
  options.coverageExclude.push('node_modules');

  options.environment = options.environment && options.environment.trim();

  if (options.silence) {
    options.progress = 0;
  } else if (options.verbose) {
    options.progress = 2;
  }

  if (options.environment) {
    process.env.NODE_ENV = options.environment;
  }

  if (options.output !== process.stdout) {
    options.colors = false;
  }

  // When lab is required, the require() extension for .js files is
  // monkey-patched, so monkey-patch it just when run() is called, not before
  this._originalLoader = require.extensions['.js'];

  if (this._options.coverage) {
    require('lab').coverage.instrument(this._options);
  }

  // Ignore options which are useless or promote bad practices
  options.assert = null;
  options.flat = false;
  options.grep = null;
  options.leaks = true;
  options.lint = false;
  options.parallel = false;
  options.sourcemaps = false;
};

Runner.prototype._expand = function (exclude) {
  var arr = [];
  var me = this;

  this._options.paths.forEach(function (pathname) {
    var ext = path.extname(pathname);
    if (!ext) {
      arr.push(globule.find([path.join(pathname, '/**/*.js')].concat(exclude), {
        filter: 'isFile',
        srcBase: me._options.base
      }));
    } else if (ext === '.js') {
      arr.push(pathname);
    }
  });

  return arr;
};

Runner.prototype.start = function (cb) {
  var lab = require('lab');

  var me = this;

  // The scripts array must be loaded just when the user is ready to load and
  // execute the tests, not before
  var scripts = this._paths.map(function (file) {
    return require(path.join(me._options.base, file)).lab;
  }).filter(function (script) {
    // Filter files that doesn't export a lab script
    if (!script || !script._root) return false;
    script._executed = true;
    return true;
  });

  // Lab forces the exit when all the tests finish
  var exitFn = process.exit;
  process.exit = hoek.ignore;

  lab.report(scripts, this._options, function (err, code) {
    process.exit = exitFn;
    require.extensions['.js'] = me._originalLoader;
    if (!err && code) {
      err = new Error('Test failed');
    }
    cb(err);
  });
};