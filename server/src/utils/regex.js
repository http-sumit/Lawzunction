/**
 * Escapes regex metacharacters in a user-supplied string to prevent ReDoS
 * and unintentional pattern matching in MongoDB / JavaScript RegExp constructors.
 *
 * @param {string} str - Raw string input from client
 * @returns {string} Sanitized string safe for new RegExp() or $regex
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
