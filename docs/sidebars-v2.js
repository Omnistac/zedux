// v2 sidebar - grabs the '🚧 v2 beta docs' section from sidebars.js
//
// Existing v2 PRs add their docs to `react['🚧 v2 beta docs']` in sidebars.js.
// This file simply extracts that section and uses it as the v2 sidebar.
//
// NOTE: This is a temporary setup. When all v2 docs PRs are merged, the OG
// sidebars.js file itself will be moved here (modified to contain only v2 items
// of course)
const baseSidebar = require('./sidebars')

/**
 * Recursively strip the 'v2/' prefix from all doc IDs in a sidebar structure.
 * Handles strings, arrays, and nested objects.
 *
 * TODO: Remove this and the above NOTE when all v2 docs PRs are merged
 */
function stripV2Prefix(item) {
  // String doc ID: 'v2/api/placeholder' → 'api/placeholder'
  if (typeof item === 'string') {
    return item.startsWith('v2/') ? item.slice(3) : item
  }

  // Array of items
  if (Array.isArray(item)) {
    return item.map(stripV2Prefix)
  }

  // Object (category, doc ref, or nested sidebar structure)
  if (typeof item === 'object' && item !== null) {
    const result = {}

    for (const [key, value] of Object.entries(item)) {
      if (key === 'id' && typeof value === 'string') {
        // Handle explicit doc id: { type: 'doc', id: 'v2/...' }
        result[key] = stripV2Prefix(value)
      } else if (key === 'items' || Array.isArray(value)) {
        // Handle category items or any array value
        result[key] = stripV2Prefix(value)
      } else if (typeof value === 'object' && value !== null) {
        // Recurse into nested objects (like { API: [...] })
        result[key] = stripV2Prefix(value)
      } else {
        // Keep other values as-is (label, type, etc.)
        result[key] = value
      }
    }

    return result
  }

  return item
}

const v2Docs = baseSidebar.react['🚧 v2 beta docs'] || {}
const transformed = stripV2Prefix(v2Docs)

module.exports = {
  react: [transformed, 'index'],
}
