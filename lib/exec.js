'use strict';

var spawn = require('child_process').spawn;

module.exports = exports = function exec(cmd, args, options) {
  options = options || {};

  // by default we pipe stdout and stderr to parent's stdout/stderr
  var stdout = 'inherit', stderr = 'inherit';

  if (options.silent) {
    // if silent, pipe to /dev/null
    stdout = stderr = 'ignore';
  }

  // keep stdout ready as readable stream if requested
  if (options.keepStdout) {
    stdout = 'pipe';
  }

  // keep stderr ready as readable stream if requested
  if (options.keepStderr) {
    stderr = 'pipe';
  }

  // console.log('Executing ' + cmd + ' ' + (args || []).join(' '));
  var child = spawn(cmd, args || [], {
    stdio: [
      'ignore', // kill off stdin
      stdout,
      stderr
    ]
  });

  var result = new Promise(function(resolve, reject) {
    child.on('close', function (code) {
      if (code == 0) {
        resolve();
      } else {
        reject(code);
      }
    });
  });

  if (options.keepStdout) {
    result.stdout = child.stdout;
  }

  if (options.keepStderr) {
    result.stderr = child.stderr;
  }

  return result;
}
