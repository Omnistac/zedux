/**
 * Docusaurus plugin for versioned documentation URL resolution
 *
 * This plugin creates routes for unversioned URLs (e.g., /docs/walkthrough/quick-start)
 * that redirect to the appropriate versioned content based on:
 * 1. Explicit redirects (for restructured content)
 * 2. Current version's sidebar (if the doc is "ready")
 * 3. Fallback to previous version with stale banner
 */

const { currentVersion, fallbackOrder, redirects } = require('../version-map')

// Import all sidebars
const sidebars = {
  v1: require('../sidebars-v1'),
  v2: require('../sidebars-v2'),
  next: require('../sidebars-next'),
}

/**
 * Recursively extract all doc paths from sidebar items
 */
function extractPaths(items) {
  const paths = []
  for (const item of items) {
    if (typeof item === 'string') {
      // Simple string reference: 'walkthrough/quick-start'
      paths.push(item)
    } else if (Array.isArray(item)) {
      // Nested array - recurse into it
      paths.push(...extractPaths(item))
    } else if (item.type === 'category' && item.items) {
      // Category with nested items: { type: 'category', label: '...', items: [...] }
      paths.push(...extractPaths(item.items))
    } else if (item.type === 'doc' && item.id) {
      // Explicit doc reference: { type: 'doc', id: 'path' }
      paths.push(item.id)
    } else if (typeof item === 'object' && item !== null && !item.type) {
      // Shorthand category: { Walkthrough: ['quick-start', ...] }
      for (const value of Object.values(item)) {
        if (Array.isArray(value)) {
          paths.push(...extractPaths(value))
        }
      }
    }
    // Ignore 'link', 'html', 'ref', etc.
  }
  return paths
}

/**
 * Extract all doc paths from a sidebar config
 * Handles nested structures like { react: { About: [...], Walkthrough: [...] } }
 */
function extractSidebarPaths(sidebar) {
  const allPaths = []

  function processValue(value) {
    if (Array.isArray(value)) {
      // Array of items - extract doc paths
      allPaths.push(...extractPaths(value))
    } else if (typeof value === 'object' && value !== null) {
      // Nested object like { About: [...], Walkthrough: [...] }
      for (const nested of Object.values(value)) {
        processValue(nested)
      }
    }
  }

  processValue(sidebar)
  return new Set(allPaths)
}

// Pre-compute sidebar paths for each version
const sidebarPaths = {
  v1: extractSidebarPaths(sidebars.v1),
  v2: extractSidebarPaths(sidebars.v2),
  next: extractSidebarPaths(sidebars.next),
}

/**
 * Determine which version a doc path should resolve to
 */
function resolveVersion(docPath) {
  // 1. Check explicit redirects first (for restructured content)
  if (redirects[docPath]?.[currentVersion]) {
    return {
      type: 'redirect',
      to: redirects[docPath][currentVersion],
    }
  }

  // 2. If it's in the current version's sidebar → use current (no banner)
  if (sidebarPaths[currentVersion].has(docPath)) {
    return {
      type: 'current',
      version: currentVersion,
      path: `/docs/${currentVersion}/${docPath}`,
    }
  }

  // 3. Fallback: find the latest version that has it in sidebar
  for (const version of fallbackOrder) {
    if (version !== currentVersion && sidebarPaths[version].has(docPath)) {
      return {
        type: 'stale',
        version,
        path: `/docs/${version}/${docPath}`,
        currentVersion,
      }
    }
  }

  return { type: 'notfound' }
}

/**
 * Docusaurus plugin entry point
 */
module.exports = function docsVersionResolver(context, options) {
  return {
    name: 'docs-version-resolver',

    async contentLoaded({ actions }) {
      const { addRoute, createData, setGlobalData } = actions

      // Expose version data to client-side components (e.g., VersionSelector)
      setGlobalData({
        sidebarPaths: Object.fromEntries(
          Object.entries(sidebarPaths).map(([v, paths]) => [v, [...paths]])
        ),
        redirects,
        currentVersion,
      })

      // Collect all unique paths across all versions
      const allPaths = new Set([
        ...sidebarPaths.v1,
        ...sidebarPaths.v2,
        ...sidebarPaths.next,
      ])

      // Create a route for each path
      for (const docPath of allPaths) {
        const resolution = resolveVersion(docPath)

        // Skip paths that don't resolve to anything
        if (resolution.type === 'notfound') {
          continue
        }

        // Create a data module with the resolution info
        const dataPath = await createData(
          `version-resolution-${docPath.replace(/\//g, '-')}.json`,
          JSON.stringify(resolution)
        )

        // Add the unversioned route
        addRoute({
          path: `/docs/${docPath}`,
          component: '@site/src/components/VersionedDocRedirect',
          modules: {
            resolution: dataPath,
          },
          exact: true,
        })
      }

      // Also add a root /docs/ route that redirects to the current version
      const rootResolution = await createData(
        'version-resolution-root.json',
        JSON.stringify({
          type: 'current',
          version: currentVersion,
          path: `/docs/${currentVersion}/`,
        })
      )

      addRoute({
        path: '/docs',
        component: '@site/src/components/VersionedDocRedirect',
        modules: {
          resolution: rootResolution,
        },
        exact: true,
      })
    },
  }
}
