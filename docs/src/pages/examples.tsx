import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import React from 'react'

export default function Examples() {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout
      title={`${siteConfig.title} Examples`}
      description="Zedux is a molecular state engine for React"
    >
      <div>🚧 This page is under construction</div>
    </Layout>
  )
}
