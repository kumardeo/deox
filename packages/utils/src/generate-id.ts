/**
 * Helper function to generate unique id
 *
 * @param format Format for generating random string
 *
 * @returns Generated random string
 */
export const generateId = (format = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx') => {
  // Timestamp
  let d1 = Date.now();
  // Time in microseconds since page-load or 0 if unsupported
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  return format.replace(/[xy]/g, (c) => {
    // random number between 0 and 16
    let r = Math.random() * 16;
    if (d1 > 0) {
      // Use timestamp until depleted
      r = ((d1 + r) % 16) | 0;
      d1 = Math.floor(d1 / 16);
    } else {
      // Use microseconds since page-load if supported
      r = ((d2 + r) % 16) | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};
