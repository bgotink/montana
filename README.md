# Montana

Montana is a utility that caches multiple versions of a directory. It allows for
easy swapping of different versions and supports creating new versions.

## Installing

Simply run

```
npm install montana
```

to install.

## Usage

The module exports the `Montana` class, available using `var Montana = require('montana')`.
The class has the following API:

- `constructor(directory, cacheLocation)`: creates a new Montana instance that will
manage the given `directory`. The `cacheLocation` is used to store versions in.
- `hasVersion(version)`: checks whether the given version exists
- `isActive()`: checks whether the `directory` is currently mounted
- `mount(version)`: mounts the given `version` on `directory` _read-only_, unmounting any previously
mounted versions
- `umount()`/`unmount()`: unmounts the `directory` if it is currently mounted
- `create(version)`: creates the given `version` cache of the `directory` in `cacheLocation`

All API functions (apart from the constructor) return a promise.

## OS support

- Windows
  - Not supported.
- OS X
  - Supported using `hdiutil`, root access not required. I've only tested on OS X 10.11 El Capitan.
- GNU/Linux
  - If the `bindfs` executable is available, Montana will use that instead. Root
  access is not required with `bindfs`. Note that on Debian/Ubuntu and derivatives
  you need to add your user to the `fuse` group and make sure you have access to
  `/dev/fuse`.
  - If `bindfs` is not available, Montana will attempt to use `mount` as fallback.
  This requires running Montana as `root`.

## License

See [LICENSE.md](https://github.com/bgotink/montana/blob/master/LICENSE.md)
