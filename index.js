'use strict';

var path = require('path');

var impl;

try {
  impl = require('./lib/impl/' + process.platform);
} catch (e) {
  console.error('Unsupported platform: ' + process.platform);
  process.exit(1);
}

var rootPromise = Promise.resolve();
if (impl.init) {
  rootPromise = impl.init();
}

module.exports = exports = DirSwapper;

var kCwd = Symbol('cwd');
var kDirectory = Symbol('directory');
var kResolvedDirectory = Symbol('resolvedDirectory');
var kStorage = Symbol('storage');
var kResolvedStorage = Symbol('resolvedStorage');
var kOptions = Symbol('options');

function DirSwapper(directory, storage, options) {
  options = options || {};
  this[kOptions] = options;
  this[kCwd] = options.cwd || process.cwd();

  this[kDirectory] = directory;
  this[kResolvedDirectory] = path.resolve(this[kCwd], directory);

  this[kStorage] = storage;
  this[kResolvedStorage] = path.resolve(this[kCwd], storage);
}

function wrapPrototypeFunction(fn) {
  return function wrappedFunction() {
    var args = Array.prototype.slice.call(arguments);
    var self = this;

    return rootPromise.then(function () {
      return fn.apply(self, args);
    });
  };
}

DirSwapper.prototype = {
  constructor: DirSwapper,

  hasVersion: wrapPrototypeFunction(function hasVersion(name) {
    return impl.exists(this.getVersionPath(name));
  }),

  getVersionPath: function getVersionPath(name) {
    return path.join(this[kResolvedStorage], name);
  },

  isActive: wrapPrototypeFunction(function isActive() {
    return impl.isMounted(this[kResolvedDirectory]);
  }),

  umount: wrapPrototypeFunction(function umount() {
    return this.isActive().then(function (active) {
      if (active) {
        return impl.unmount(this[kResolvedDirectory]);
      }
    }.bind(this));
  }),

  mount: wrapPrototypeFunction(function link(version) {
    return this.hasVersion(version).then(function (hasVersion) {
      if (!hasVersion) {
        throw new Error('Unknown version ' + version + ' in ' + this[kStorage]);
      }

      return this.umount();
    }.bind(this))
    .then(function () {
      return impl.mount(this.getVersionPath(version), this[kResolvedDirectory]);
    }.bind(this));
  }),

  create: wrapPrototypeFunction(function create(version) {
    return Promise.all([
      this.hasVersion(version),
      this.isActive()
    ]).then(function (res) {
      if (res[0]) {
        throw new Error('Version ' + version + ' already exists in ' + this[kStorage]);
      }

      if (res[1]) {
        throw new Error('Directory ' + this[kDirectory] + ' is already managed, nothing to create');
      }

      return impl.create(this.getVersionPath(version), this[kResolvedDirectory]);
    }.bind(this));
  })
};

DirSwapper.prototype.unmount = DirSwapper.prototype.umount;

