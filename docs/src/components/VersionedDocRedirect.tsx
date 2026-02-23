import React from 'react'
import { Redirect } from '@docusaurus/router'

interface Resolution {
  type: 'redirect' | 'current' | 'stale' | 'notfound'
  to?: string
  version?: string
  path?: string
  currentVersion?: string
}

interface Props {
  resolution: Resolution
}

/**
 * Component that handles redirection for unversioned doc URLs.
 * Redirects to the appropriate versioned URL based on resolution config.
 */
export default function VersionedDocRedirect({ resolution }: Props) {
  if (resolution.type === 'redirect') {
    // Explicit redirect to a new location
    return <Redirect to={resolution.to!} />
  }

  if (resolution.type === 'current') {
    // Doc exists in current version - redirect without stale flag
    return <Redirect to={resolution.path!} />
  }

  if (resolution.type === 'stale') {
    // Doc only exists in older version - redirect with stale flag for banner
    return <Redirect to={`${resolution.path}?stale=true`} />
  }

  // Fallback: redirect to docs root
  return <Redirect to="/docs/" />
}
