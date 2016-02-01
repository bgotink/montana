'use strict';

var exec = require('../exec');
var which = require('which');
var path = require('path');
var fsp = require('fs-promise');

var UID_ROOT = 0;
var DIRNAME = 'directory';

var commands = Promise.reject(new Error('Expected impl.init() to be called'));

exports.init = function () {
  commands = new Promise(function (resolve) {
    which('bindfs', function (err) {
      resolve(!err)
    });
  })
  .then(function (hasBindfs) {
    if (!hasBindfs) {
      // no bindfs

      if (process.getuid() != UID_ROOT) {
        return Promise.reject('Either install bindfs to allow userspace mount binding or run this program as root');
      }

      return {
        mount: function rootMount(directory, mountpoint) {
          return exec('mount', [
            '--bind',
            directory,
            mountpoint
          ]).then(function () {
            return exec('mount', [
              '-o', 'remount,ro',
              mountpoint
            ]);
          });
        },
        unmount: function rootUmount(mountpoint) {
          return exec('umount', [ mountpoint ]);
        },
      };
    }

    // bindfs

    return fsp.readFile('/etc/fuse.conf')
      .then(function (content) {
        content = String(content);

        return !!content.split(/\n+/).find(function (line) {
          return line.match(/^[^#]*user_allow_other$/)
        });
      })
      .catch(function (err) {
        return false;
      })
      .then(function (canAllowOther) {
        if (process.getuid() == UID_ROOT) {
          canAllowOther = true;
        }

        var options = [ '-o', 'ro,nonempty' ];

        if (!canAllowOther) {
          options.unshift('--no-allow-other');
        }

        return {
          mount: function fusermount(directory, mountpoint) {
            return exec('bindfs', options.concat([
              directory,
              mountpoint
            ]));
          },
          unmount: function fuserumount(mountpoint) {
            return exec('fusermount', [ '-u', mountpoint ]);
          }
        };
      });
  });

  return commands.then(function () {});
};

exports.exists = function exists(directory) {
  return fsp.exists(
    path.join(directory, DIRNAME)
  );
};

exports.isMounted = function isMounted(directory) {
  return exec('grep', [
    '-qs',
    directory,
    '/proc/mounts'
  ]).then(function () {
    return true;
  }).catch(function () {
    return false;
  });
};

exports.mount = function mount(directory, mountpoint) {
  return fsp.ensureDir(mountpoint)
    .then(function () {
      return commands
    })
    .then(function (commands) {
      return commands.mount(
        path.join(directory, DIRNAME),
        mountpoint
      );
    });
};

exports.unmount = function umount(mountpoint) {
  return commands.then(function (commands) {
    return commands.unmount(mountpoint);
  });
};

exports.create = function create(directory, source) {
  return fsp.ensureDir(directory).then(function () {
    return fsp.copy(
      source,
      path.join(directory, DIRNAME)
    );
  });
};

