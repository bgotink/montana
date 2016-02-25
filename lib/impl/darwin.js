'use strict';

var fsp = require('fs-promise');
var path = require('path');
var exec = require('../exec');

var filename = 'directory.dmg';

exports.exists = function exists(directory) {
  return fsp.exists(
    path.join(directory, filename)
  );
};

exports.isMounted = function (directory) {
  var mount = exec('mount', undefined, {
    keepStdout: true
  });

  var found = false;

  mount.stdout.on('data', function (data) {
    if (found) {
      return;
    }

    data = String(data);

    if (data.indexOf('on ' + directory + ' ') !== -1) {
      found = true;
    }
  });

  return mount.then(function () {
    return found;
  });
}

exports.unmount = function unmunt(directory) {
  return hdiutil('detach', directory);
}

exports.mount = function mount(imagePath, mountpoint) {
  return hdiutil('attach', path.join(imagePath, filename), {
    mountpoint: mountpoint,
    readonly: true
  });
}

exports.create = function create(imagePath, source) {
  return fsp.ensureDir(imagePath).then(function () {
    return hdiutil('create', [
      '-srcfolder', source,
      path.join(imagePath, filename)
    ]);
  });
}

function ensureArray(el) {
  return Array.isArray(el) ? el : [ el ];
}

function hdiutil(verb, args, options) {
  var execArgs = [ verb ].concat(ensureArray(args));

  Object.keys(options || {}).forEach(function (option) {
    if (!options.hasOwnProperty(option)) {
      return;
    }

    if (!options[option] && options[option] !== '') {
      return;
    }

    execArgs.push('-' + option);

    if (options[option] !== true) {
      execArgs.push(options[option]);
    }
  });

  return exec('hdiutil', execArgs, {
    silent: true
  });
}
