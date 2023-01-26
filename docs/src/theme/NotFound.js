import React from 'react'
import { translate } from '@docusaurus/Translate'
import { PageMetadata } from '@docusaurus/theme-common'
import Layout from '@theme/Layout'
import styled from 'styled-components'

const Header = styled.div`
  font-size: 3rem;
  padding: 1rem 0;
`

const Text = styled.div`
  padding: 1rem 0;
`

const Wrapper = styled.div`
  margin: auto;
  max-width: 700px;
  padding: 3rem 0;
`

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
        <Wrapper>
          <Header>Nope</Header>
          <Text>We couldn&apos;t find that page.</Text>
          <Text>
            If you arrived here from a link on this site, then this is our fault
            and we apologize profusely. Docs are hard! We&apos;re working on
            them.
          </Text>
          <Text>
            If you arrived here from an external link then whoops! Looks like we
            might have moved something around and broken the internet. Oh well.
          </Text>
          <Text>
            If you arrived here from typing in the address bar, then you did it
            wrong and should feel sad. Unless ... you <i>meant</i> to do it
            wrong ... in which case you may feel happy.
          </Text>
        </Wrapper>
      </Layout>
    </>
  )
}
