import React from 'react'
import Link from '@docusaurus/Link'

interface Props {
  version: string
  currentVersion: string
}

/**
 * Banner displayed when viewing documentation from a non-current version.
 * Shows different messages for old versions vs unreleased (next) versions.
 */
export default function StaleBanner({ version, currentVersion }: Props) {
  const isNext = version === 'next'

  return (
    <div className={`stale-banner ${isNext ? 'stale-banner--next' : ''}`}>
      <span className="stale-banner__icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isNext ? (
            // Info icon for unreleased
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </>
          ) : (
            // Warning icon for old versions
            <>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </>
          )}
        </svg>
      </span>
      <span className="stale-banner__text">
        {isNext ? (
          <>
            <strong>You're viewing unreleased documentation.</strong> This page
            may change before the next release.{' '}
          </>
        ) : (
          <>
            <strong>You're viewing {version} documentation.</strong> This page
            may be outdated or differ from the current version.{' '}
          </>
        )}
        <Link to={`/docs/${currentVersion}/`}>
          View {currentVersion} docs &rarr;
        </Link>
      </span>
    </div>
  )
}
