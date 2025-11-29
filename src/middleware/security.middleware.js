import aj from '../config/arcjet.js';
import logger from '../config/logger.js';
import { slidingWindow } from '@arcjet/node';

// Middleware: apply security rules per request using Arcjet.
// This middleware inspects the authenticated user's role (if any)
// and applies a role-based sliding-window rate limit. It also
// evaluates Arcjet's decision and responds appropriately for
// bots, shielded requests, and rate-limit denials.
export const securityMiddleware = async (req, res, next) => {
  try {
    // Determine role from authenticated user; default to 'guest'.
    const role = req.user?.role || 'guest';

    // Role-based rate limit values. Adjust as needed for your app.
    let limit;

    switch (role) {
      case 'admin':
        limit = 20; // higher allowance for admins
        break;
      case 'user':
        limit = 10; // normal logged-in users
        break;
      case 'guest':
        limit = 5; // unauthenticated or minimal-access users
        break;
    }

    // Create a client instance with a per-request sliding-window rule.
    // `interval` is the time window and `max` is the permitted events
    // in that window. `name` helps identify the rule in logs/metrics.
    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    // Ask Arcjet to evaluate the request against the configured rules.
    const decision = await client.protect(req);

    // If Arcjet denies the request because it classified it as a bot,
    // log details and return a 403 Forbidden with a clear message.
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed',
      });
    }

    // If the Shield rule denies the request (e.g., matches a policy),
    // log and reject the request with a security-policy message.
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield Blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
      });
    }

    // Rate-limit denial: inform the client that they've exceeded
    // the allowed number of requests for their role.
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Too many requests' });
    }

    // If Arcjet did not deny the request, continue to the next handler.
    next();
  } catch (e) {
    // Catch unexpected errors in the security middleware, log to console
    // for debugging, and return a 500 response. Note: logger could be
    // used here instead of console.error depending on logging policy.
    console.error('Arcjet middleware error:', e);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong with security middleware',
    });
  }
};

// Export middleware for use in route definitions.
export default securityMiddleware;
