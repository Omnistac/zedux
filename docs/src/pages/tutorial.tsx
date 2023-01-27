import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import styled from '@site/src/ssc'
import React from 'react'

const Text = styled.div`
  font-size: 2em;
  margin: auto;
`

export default function Tutorial() {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout
      title={`${siteConfig.title} Tutorial`}
      description="Zedux is a molecular state engine for React"
    >
      <Text>🚧 This page is under construction</Text>
    </Layout>
  )
}
