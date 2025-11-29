/**
 * Arcjet configuration
 *
 * This module creates and exports a configured Arcjet client instance
 * used by the application to apply traffic-protection rules such as
 * bot detection, shielding, and simple rate limiting.
 *
 * Important: set the `ARCJET_KEY` environment variable with your
 * Arcjet API key before starting the app.
 */

import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

// Create a configured Arcjet client. The `rules` array composes
// protection middleware that Arcjet will apply when evaluating
// incoming requests or events.
const aj = arcjet({
  // API key read from environment variables
  key: process.env.ARCJET_KEY,
  rules: [
    // Shield: general protection layer. Use 'LIVE' in production
    // or 'TEST' when developing.
    shield({ mode: 'LIVE' }),

    // detectBot: classify traffic as bots or humans. The `allow`
    // option whitelists some categories (e.g. search engines,
    // preview crawlers) so they won't be treated as malicious.
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),

    // slidingWindow: a simple rate-limiting rule. `interval` sets
    // the time window and `max` is the maximum allowed events
    // within that window before Arcjet will consider blocking.
    slidingWindow({
      mode: 'LIVE',
      interval: '2s', // window duration
      max: 5, // maximum allowed events in the window
    }),
  ],
});

// Export the configured Arcjet instance for use in middleware/routes
export default aj;
