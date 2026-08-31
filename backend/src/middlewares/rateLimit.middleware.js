// Rate limiting middleware
const requestCounts = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // Relax rate limiting in development mode or for localhost calls
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip?.includes('127.0.0.1');
    const limit = (isDev || isLocalhost) ? Math.max(maxRequests * 10, 500) : maxRequests;

    const key = `${req.ip}_${req.baseUrl}${req.path}`;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const requests = requestCounts.get(key);

    // Clean up old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    requestCounts.set(key, validRequests);

    if (validRequests.length >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    validRequests.push(now);
    next();
  };
};

module.exports = rateLimit;
