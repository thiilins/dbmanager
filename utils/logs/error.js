function logError(message) {
  console.error(`\x1b[31m${message}\x1b[0m`); // Vermelho
}

module.exports = logError;
