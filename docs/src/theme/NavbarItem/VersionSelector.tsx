import React from 'react'
import { useLocation } from '@docusaurus/router'
import { usePluginData } from '@docusaurus/useGlobalData'
import { currentVersion } from '@site/version-map'

const versions = [
  { label: 'v2 (latest)', value: 'v2' },
  { label: 'v1', value: 'v1' },
  // { label: 'next (unreleased)', value: 'next' },
]

/**
 * Version selector dropdown for the navbar.
 * Resolves cross-version navigation using sidebar paths and redirects from the
 * docs-version-resolver plugin.
 */
export default function VersionSelector() {
  const location = useLocation()
  const { sidebarPaths, redirects } = usePluginData(
    'docs-version-resolver'
  ) as {
    sidebarPaths: Record<string, string[]>
    redirects: Record<string, Record<string, string>>
    currentVersion: string
  }

  // Extract current version from URL
  const versionMatch = location.pathname.match(/\/docs\/(v\d+|next)\//)
  const activeVersion = versionMatch?.[1] || currentVersion

  // Extract the doc path after the version (e.g., /docs/v1/walkthrough/quick-start -> walkthrough/quick-start)
  const docPathMatch = location.pathname.match(/\/docs\/(?:v\d+|next)\/(.*)/)
  const docPath = docPathMatch?.[1]?.replace(/\/$/, '') || ''

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersion = e.target.value
    if (newVersion === activeVersion) return

    // 1. Check explicit redirects
    const redirect = redirects[docPath]?.[newVersion]
    if (redirect) {
      window.location.href = redirect
      return
    }

    // 2. Check if the current path exists in the target version's sidebar
    const targetPaths = sidebarPaths[newVersion] || []
    if (targetPaths.includes(docPath)) {
      window.location.href = `/docs/${newVersion}/${docPath}`
      return
    }

    // 3. Fall back to the target version's root
    window.location.href = `/docs/${newVersion}/`
  }

  return (
    <div className="version-selector">
      <select
        aria-label="Select documentation version"
        className="version-selector__select"
        name="version-selector"
        onChange={handleVersionChange}
        defaultValue={activeVersion}
      >
        {versions.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
