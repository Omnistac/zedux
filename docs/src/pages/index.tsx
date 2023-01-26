import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import React from 'react'
import { Hero } from '../components/Hero'
import { Features } from '../components/Features'
import { Example } from '../components/Example'
import { LearningPaths } from '../components/LearningPaths'

export default function Home() {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout
      title={`${siteConfig.title} Docs`}
      description="Zedux is a molecular state engine for React"
    >
      <Hero />
      <Features />
      <Example />
      <LearningPaths />
    </Layout>
  )
}
