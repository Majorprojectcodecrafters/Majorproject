const logger = require('./logger');

/**
 * Standardized server error response that logs full exception details internally
 * while sanitizing error messages in production to prevent information leakage.
 */
const sendServerError = (res, error, userFriendlyMessage = 'An unexpected server error occurred') => {
  if (logger && logger.error) {
    logger.error(error?.message || userFriendlyMessage, {
      stack: error?.stack,
      name: error?.name
    });
  } else {
    console.error('Server error:', error);
  }

  const isDev = process.env.NODE_ENV === 'development';

  return res.status(500).json({
    success: false,
    message: isDev ? (error?.message || userFriendlyMessage) : userFriendlyMessage,
    ...(isDev && { error: error?.message, stack: error?.stack })
  });
};

module.exports = { sendServerError };
