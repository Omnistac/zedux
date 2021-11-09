import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import textureUrl from '@site/static/img/bg-texture.png'
import React from 'react'
import styled from 'styled-components'

import {
  Buttons,
  H1,
  HeaderContent,
  Link,
  SlidingBg,
  Tagline,
} from '../css/index.styles'

export const StyledHeader = styled.header`
  align-items: center;
  color: #fff;
  display: flex;
  flex: 1;
  padding: 6rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::after,
  &::before {
    content: '';
    height: 6rem;
    position: absolute;
    right: 0;
    left: 0;
  }

  &::before {
    background: linear-gradient(180deg, var(--color-dark), transparent);
    top: 0;
    z-index: 1;
  }

  &::after {
    background: linear-gradient(0, var(--color-dark), transparent);
    bottom: 0;
  }

  @media screen and (max-width: 966px) {
    padding: 4rem 2rem;

    &::before,
    &::after {
      height: 4rem;
    }
  }
`

export const Header = () => {
  const { siteConfig } = useDocusaurusContext()

  return (
    <StyledHeader>
      <SlidingBg url={textureUrl} />
      <HeaderContent className="container">
        <H1>{siteConfig.title}</H1>
        <Tagline>{siteConfig.tagline}</Tagline>
        <Buttons>
          <Link to={useBaseUrl('docs/walkthrough/quick-start')}>
            Quick Start!
          </Link>
          <Link to={useBaseUrl('docs/api/classes/Atom')}>API Docs</Link>
        </Buttons>
      </HeaderContent>
    </StyledHeader>
  )
}
