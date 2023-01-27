import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import React from 'react'
import styled from '@site/src/ssc'

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`

function NotDone() {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="Zedux is a molecular state engine for React"
    >
      <Main>
        <h1>Yikes!</h1>
        <p>
          Looks like that feature is not documented yet. We&apos;re working on
          it!
        </p>
      </Main>
    </Layout>
  )
}

export default NotDone
