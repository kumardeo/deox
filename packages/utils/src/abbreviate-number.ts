import { isValidNumber } from './predicate';

const units = ['K', 'M', 'B', 'T', 'Q', 'Qu', 'S', 'Se', 'O', 'N', 'D'] as const;

/**
 * Abbreviates number
 *
 * @param number Number
 * @param  dp Maximum number of decimal places to display.
 * @default 1
 * @param sDp `true` to display fixed number of decimal places provided in `dp`
 * @default false
 *
 * @returns Formatted string array
 */
export const abbreviateNumber = (number: number, dp = 1, sDp = false): [string, '' | (typeof units)[number]] => {
  if (!isValidNumber(number)) {
    throw new TypeError(`Argument 1, ${number} is not valid`);
  }

  let numberC = number;
  const thresh = 1000;

  if (Math.abs(numberC) < thresh) {
    return [String(numberC), ''];
  }

  let u = -1;
  const r = 10 ** dp;

  do {
    numberC /= thresh;
    u += 1;
  } while (Math.round(Math.abs(numberC) * r) / r >= thresh && u < units.length - 1);

  let fixed = numberC.toFixed(dp);
  if (!sDp) {
    fixed = String(Number(fixed));
  }
  return [fixed, units[u]];
};
