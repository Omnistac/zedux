/**
 * Documentation Version Configuration
 *
 * This file controls how unversioned URLs (e.g., /docs/walkthrough/quick-start)
 * resolve to versioned content.
 *
 * The sidebar files (sidebars-v1.js, sidebars-v2.js, etc.) are the source of
 * truth for which docs are "ready" in each version. Adding a doc to a sidebar
 * automatically makes it the target for unversioned URLs.
 */
module.exports = {
  // Which version unversioned URLs should prefer
  // Change this when releasing a new major version
  currentVersion: 'v2',

  // Order of versions for fallback resolution (newest to oldest)
  // 'next' is excluded - it's for development only
  fallbackOrder: ['v2', 'v1'],

  // Explicit redirects for pages that have been removed or restructured
  // Only needed when the path no longer exists in currentVersion's sidebar
  // and you want to redirect to a different location instead of showing stale content
  //
  // Format:
  //   'old/path': { v2: '/docs/v2/new/path' }
  //
  // Example:
  //   'advanced/old-feature': { v2: '/docs/v2/advanced/new-feature' }
  //
  redirects: {},
}
