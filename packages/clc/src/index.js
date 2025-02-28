var colorList = {
  // modifier
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],
  // color
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],
  // Bright color
  redBright: [91, 39],
  greenBright: [92, 39],
  yellowBright: [93, 39],
  blueBright: [94, 39],
  magentaBright: [95, 39],
  cyanBright: [96, 39],
  whiteBright: [97, 39],
  // bgColor
  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],
  // bgColor - legacy styles
  blackBG: [40, 49],
  redBG: [41, 49],
  greenBG: [42, 49],
  yellowBG: [43, 49],
  blueBG: [44, 49],
  magentaBG: [45, 49],
  cyanBG: [46, 49],
  whiteBG: [47, 49],
  // Bright bgColor
  bgBlackBright: [100, 49],
  bgRedBright: [101, 49],
  bgGreenBright: [102, 49],
  bgYellowBright: [103, 49],
  bgBlueBright: [104, 49],
  bgMagentaBright: [105, 49],
  bgCyanBright: [106, 49],
  bgWhiteBright: [107, 49],
};
var c256List = {};

// Process object
var proc = {};
if (typeof process === "object") {
  if (process.env) proc.env = process.env;
  if (process.argv) proc.argv = process.argv;
  if (process.platform) proc.platform = process.platform;
}
if (!proc.env) proc.env = {};
if (!proc.argv) proc.argv = [];
if (!proc.platform) proc.platform = null;

function isatty(fd) {
  try {
    return eval("require('tty')").isatty(fd)
  } catch (e) {}
  return false;
}

var isLowMemory = proc.env.CLC_LOW_MEMORY == '1';
var isC256Disabled = proc.env.CLC_C256 == '0';
var isDisabled = proc.env.NO_COLOR || proc.argv.includes('--no-color');
var isSupported = !isDisabled && (
  proc.env.FORCE_COLOR ||
  proc.platform === 'win32' ||
  proc.argv.length === 0 ||
  proc.argv.includes('--color') ||
  (isatty(1) && proc.env.TERM !== 'dumb') ||
  proc.env.CI
);

var TObject = typeof Reflect === 'undefined' ? Object : Reflect;

var fncache = {};
function extend(fn, keys) {
  var prefix = keys.join('');
  Object.keys(clc.list).forEach(function (key) {
    // if (keys.indexOf(key) !== -1) return;
    var cachekey = prefix + key;
    TObject.defineProperty(fn, key, {
      get() {
        if (!fncache[cachekey]) {
          fncache[cachekey] = extend(function m(s) {
            return fn(color[key](s));
          }, keys.concat(key));
        }
        return fncache[cachekey];
      },
    });
  });
  return fn;
}

function replaceClose(str, open, close, idx) {
  var rest = str.substring(idx + close.length);
  var nextIdx = rest.indexOf(close);
  return str.substring(0, idx) + open + (~nextIdx ? replaceClose(rest, open, close, nextIdx) : rest);
}
function toString(s) {
  return s;
}
function getFn(colorType) {
  var cfg = clc.list[colorType];
  if (!cfg || !isSupported) return toString;
  var open = cfg[0],
    close = cfg[1];
  return function (str) {
    if (str === '' || str == null) return '';
    str = '' + str;
    var idx = str.indexOf(close, open.length);
    return open + (idx > -1 && idx < str.length - 1 ? replaceClose(str, open, close, idx) : str) + close;
  };
}
function color(str, colorType) { return getFn(colorType)(str); }
function init() {
  var cache = {};
  if (!isLowMemory) {
    Object.keys(colorList).forEach(function (key) {
      clc[key] = color[key] = extend(getFn(key), [key]);
    });
  }
  Object.keys(clc.list).forEach(function (key) {
    if (!color[key]) {
      Object.defineProperty(color, key, {
        get() {
          if (!cache[key]) cache[key] = extend(getFn(key), [key]);
          return cache[key];
        },
      });
    }

    if (!clc[key]) {
      Object.defineProperty(clc, key, {
        get() {
          return cache[key] || color[key];
        },
      });
    }
  });
}

if (!isC256Disabled) {
  for (var i = 0; i < 256; i++) {
    c256List['c' + i] = ['38;5;' + i, 0];
    c256List['bg' + i] = ['48;5;' + i, 0];
  }
}

var clc = {
  color: color,
  list: Object.assign({}, colorList, c256List),
  log(str, colorType) {
    console.log(color(str, colorType));
  },
  isSupported() {
    return isSupported;
  },
  enable() {
    isSupported = true;
    init();
  },
  disable() {
    isSupported = false;
    init();
  },
  strip(str) {
    return str.replace(/\x1b\[\d+m/gm, '');
  },
};
color.list = clc.list;

Object.keys(clc.list).forEach(function (key) {
  clc.list[key] = clc.list[key].map(function (n) { return '\x1b[' + n + 'm' });
  clc.log[key] = function () {
    var arr = [];
    for (var i = 0; i < arguments.length; i++) arr.push(arguments[i]);
    console.log(color[key](arr.join(' ')));
  };
});

init();

if (typeof module === 'object') module.exports = clc;
