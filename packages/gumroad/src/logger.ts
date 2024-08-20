import clc from 'console-log-colors';

export class Logger {
  enabled = true;

  constructor(enable = true) {
    this.enabled = enable === true;
  }

  log(...data: unknown[]) {
    if (this.enabled) {
      console.log(...data);
    }
  }

  info(...data: unknown[]) {
    if (this.enabled) {
      console.info(...data);
    }
  }

  error(...data: unknown[]) {
    if (this.enabled) {
      console.error(...data);
    }
  }

  function(e: unknown, func: string | string[], params?: Record<string, unknown>) {
    const stringified = params
      ? Object.keys(params)
          .map((param) => {
            const value = params[param];
            let coloredValue: string;
            if (typeof value === 'string' || value instanceof RegExp) {
              coloredValue = clc.green(JSON.stringify(value));
            } else if (value === null || value === undefined) {
              coloredValue = clc.yellow(String(value));
            } else {
              coloredValue = JSON.stringify(value);
            }
            return `${clc.red(param)}: ${coloredValue}`;
          })
          .join(', ')
      : '';

    const error: {
      instance: unknown;
      name: string;
      message: string;
      stack?: string;
      cause?: unknown;
    } = {
      instance: e,
      name: 'UnknownError',
      message: 'An unexpected error ocurred',
    };

    if (e instanceof Error) {
      error.name = e.name;
      error.message = e.message;
      error.stack = e.stack;
      error.cause = e.cause;
    }

    const coloredFunc = (typeof func === 'string' ? func.split('.') : func)
      .map((p, i, s) => (i === s.length - 1 ? clc.blue(p) : clc.yellow(p)))
      .join('.');
    const coloredError = `[${clc.bold.red(error.name)}]: ${clc.yellow(error.message)}`;

    this.log(`${clc.red('[@deox/gumroad:error]')} ${coloredFunc}${clc.blue('(')}${stringified}${clc.blue(')')} ${clc.magenta('=>')} ${coloredError}`);
  }
}
