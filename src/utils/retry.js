const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Number} maxAttempts - Maximum number of attempts
 * @param {Number} delayMs - Initial delay in milliseconds
 * @param {String} operationName - Name of the operation for logging
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, maxAttempts, delayMs, operationName = 'Operation') {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        logger.error(`${operationName} failed after ${maxAttempts} attempts`, {
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }

      const delay = delayMs * Math.pow(2, attempt - 1);
      logger.warn(`${operationName} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`, {
        error: error.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { retryWithBackoff };
