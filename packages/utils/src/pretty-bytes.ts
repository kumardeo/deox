import { isValidNumber } from './predicate';

const siUnits = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;
const iecUnits = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'] as const;

/**
 * Format bytes as human-readable text.
 *
 * @param  bytes Number of bytes.
 * @param  si `true` to use metric (SI) units, aka powers of 1000. `false` to use binary (IEC), aka powers of 1024.
 * @default false
 * @param  dp Maximum number of decimal places to display.
 * @default 1
 * @param sDp `true` to display fixed number of decimal places provided in `dp`
 * @default false
 *
 * @returns Formatted string array.
 */
export const prettyBytes = <SI extends boolean = false>(
  bytes: number,
  si: SI = false as SI,
  dp = 1,
  sDp = false,
): [string, 'B' | (SI extends true ? typeof siUnits : typeof iecUnits)[number]] => {
  if (!isValidNumber(bytes)) {
    throw new TypeError(`Argument 1: ${bytes} is not valid.`);
  }

  let bytesC = bytes;
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytesC) < thresh) {
    return [String(bytesC), 'B'];
  }

  const units = si ? siUnits : iecUnits;
  let u = -1;
  const r = 10 ** dp;

  do {
    bytesC /= thresh;
    u += 1;
  } while (Math.round(Math.abs(bytesC) * r) / r >= thresh && u < units.length - 1);

  let fixed = bytesC.toFixed(dp);
  if (!sDp) {
    fixed = String(Number(fixed));
  }
  return [fixed, units[u]];
};
