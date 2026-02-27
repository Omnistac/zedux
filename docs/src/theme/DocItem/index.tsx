import React from 'react'
import DocItem from '@theme-original/DocItem'
import type DocItemType from '@theme/DocItem'
import type { WrapperProps } from '@docusaurus/types'
import { useLocation } from '@docusaurus/router'
import StaleBanner from '@site/src/components/StaleBanner'
import { currentVersion } from '@site/version-map'

type Props = WrapperProps<typeof DocItemType>

/**
 * Wrapper around DocItem that displays a version banner
 * when viewing docs from a non-current version.
 */
export default function DocItemWrapper(props: Props): JSX.Element {
  const location = useLocation()

  // Extract version from URL path (e.g., /docs/v1/... → v1)
  const versionMatch = location.pathname.match(/\/docs\/(v\d+|next)\//)
  const version = versionMatch?.[1]

  // Show banner for any version that isn't the current version
  const showBanner = version && version !== currentVersion

  return (
    <>
      {showBanner && (
        <StaleBanner version={version} currentVersion={currentVersion} />
      )}
      <DocItem {...props} />
    </>
  )
}
