// A clean, non-deprecated shim that uses the platform's native DOMException
module.exports = globalThis.DOMException || class DOMException extends Error {
  constructor(message, name) {
    super(message);
    this.name = name || 'DOMException';
    this.code = 0;
  }
};
