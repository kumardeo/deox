export const HOSTS_REGEX = /^(https?:)?(\/\/)[^/]*.(googleusercontent\.com|blogspot\.com)/;
export const PARAMS_REGEX = /[^/]+(?=\/[^/]+\.[^/?]+(?:\?|$))|(?<==)[^=&?/]+(?=\?|$)/;
export const PARAM_REGEX =
  /^(rj|rp|rw|rwa|rg|rh|nw|h|g|k|x|y|z|a|d|b|r|n|s|c|o|p|cc|dv|vm|no|ip|sm|fg|pg|ft|ng|lo|fv|ci|al|df|fh|pf|pp|gd|il|lf|md|mo|mv|nc|nd|ns|nu|nt0|pa|rwu|sg|sm)$|^(w|h|s|b|e|r|l|v|m|a|ba|pd|br|cp|iv|pc|sc|vb)(\d+)$|^(c|bc|pc)(0x[0-9A-Fa-f]{6,8})$|^(fcrop64)(=1,[0-9A-Fa-f]{6,16})$|^(fSoften)(=\d+,\d+,\d+)$|^(mm)(,[0-9A-Za-z]+)$|^(t|q)([0-9A-Za-z]+)$/;

export function getParamInfo(param: string): [number, string, boolean | number | string] | null {
  const matches = param.match(PARAM_REGEX);

  if (!matches) {
    return null;
  }

  // boolean param
  if (matches[1]) {
    return [0, matches[1], true];
  }
  // number param
  if (matches[2] && matches[3]) {
    return [1, matches[2], Number(matches[3])];
  }
  // hex param
  if (matches[4] && matches[5]) {
    return [2, matches[4], matches[5]];
  }
  // free crop param
  if (matches[6] && matches[7]) {
    return [3, matches[6], matches[7]];
  }
  // free soften param
  if (matches[8] && matches[9]) {
    return [4, matches[8], matches[9]];
  }
  // unknown param
  if (matches[10] && matches[11]) {
    return [5, matches[10], matches[11]];
  }
  if (matches[12] && matches[13]) {
    return [6, matches[12], matches[13]];
  }

  return null;
}
