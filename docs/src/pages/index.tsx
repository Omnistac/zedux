import Layout from '@theme/Layout'
import React from 'react'
import { Hero } from '../components/Hero'
import { Features } from '../components/Features'
import { Example } from '../components/Example'
import { LearningPaths } from '../components/LearningPaths'

export default function Home() {
  return (
    <Layout title="Docs" description="A molecular state engine for React">
      <Hero />
      <Features />
      <Example />
      <LearningPaths />
    </Layout>
  )
}
