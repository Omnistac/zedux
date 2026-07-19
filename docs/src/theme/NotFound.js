import Link from '@docusaurus/Link'
import { translate } from '@docusaurus/Translate'
import { PageMetadata } from '@docusaurus/theme-common'
import Layout from '@theme/Layout'
import React from 'react'

export default function NotFound() {
  return (
    <>
      <PageMetadata
        title={translate({
          id: 'theme.NotFound.title',
          message: 'Page Not Found',
        })}
      />
      <Layout>
        <main className="zedux-not-found">
          <span className="zedux-not-found__eyebrow">404 · Page not found</span>
          <h1>This route has no state.</h1>
          <p>
            The page may have moved, or the URL may be incorrect. Head back to
            the docs and we&apos;ll get you connected to the graph again.
          </p>
          <Link to="/docs/walkthrough/quick-start">Go to the docs</Link>
        </main>
      </Layout>
    </>
  )
}
