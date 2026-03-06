import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import logoUrl from '@site/static/img/logo.png'
import textureUrl from '@site/static/img/bg-texture.png'
import { motion } from 'framer-motion'
import React from 'react'
import styled, { css } from '@site/src/ssc'
import { GraphAnimation } from './GraphAnimation'

const link = (color: string) => css`
  border: 4px solid transparent;
  border-bottom-color: ${color};
  color: ${color};
  font-size: 2.5rem;
  grid-row: 4;
  margin: 0 2rem;
  padding: 0 2rem;
  transition: border 0.2s;
  z-index: 1;

  &:hover {
    border-color: ${color};
    border-top-color: transparent;
    color: ${color};
    text-decoration: none;
  }

  &:active {
    border-top-color: ${color};
  }
`

const Wrapper = styled.section`
  display: flex;
  flex: 1;
  min-height: calc(80vh - 60px);
`

const LogoWrapper = styled.div<{ url: string }>`
  align-items: center;
  display: grid;
  grid-template-rows: 1fr 2fr auto 2fr;
  flex: 1;
  justify-items: end;
  position: relative;

  &::before {
    background: url(${({ url }) => url}) right top;
    content: '';
    filter: invert(1);
    height: 100%;
    left: 0;
    opacity: 0.4;
    position: absolute;
    top: 0;
    width: 100%;
  }
`

const Logo = styled.div<{ url: string }>`
  background: url(${({ url }) => url}) no-repeat;
  background-size: cover;
  grid-row: 2;
  height: 9rem;
  width: 9rem;
  z-index: 1;
`

const TaglineDark = styled.div`
  color: var(--color-primary);
  font-size: 1.5rem;
  grid-row: 3;
`

const QuickStart = motion(styled(Link)`
  ${link('var(--color-primary)')}
`)

const NameWrapper = styled.div<{ url: string }>`
  align-items: center;
  background: url(${({ url }) => url}) var(--color-primary);
  color: #fff;
  display: grid;
  flex: 1;
  grid-template-rows: 1fr 2fr auto 2fr;
  justify-items: start;
`

const Name = styled.div`
  font-size: 5rem;
  grid-column: 1;
  grid-row: 2;
  z-index: 1;
`

const TaglineLight = styled.div`
  color: #fff;
  font-size: 1.5rem;
  grid-column: 1;
  grid-row: 3;
  z-index: 1;
`

const ApiDocs = motion(styled(Link)`
  ${link('#fff')}
  grid-column: 1;
`)

const TaglineChar = motion(styled.span`
  display: inline;
`)

const getAnimation = (index: number) => ({
  animate: { scale: 1 },
  initial: { scale: 0 },
  transition: { delay: 0.1 * (index + 1), stiffness: 100, type: 'spring' },
})

const getTaglineAnimation = (index: number) => ({
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 50 },
  transition: { delay: 0.03 * index, stiffness: 100, type: 'spring' },
})

export const Hero = () => {
  const { tagline } = useDocusaurusContext().siteConfig
  const middleChar = Math.floor(tagline.length / 2)

  return (
    <Wrapper>
      <LogoWrapper url={textureUrl}>
        <Logo url={logoUrl} />
        <TaglineDark>
          {tagline
            .slice(0, middleChar)
            .split('')
            .map((char, index) => (
              <TaglineChar {...getTaglineAnimation(index)} key={index}>
                {char === ' ' ? <>&nbsp;</> : char}
              </TaglineChar>
            ))}
        </TaglineDark>
        <QuickStart
          {...getAnimation(0)}
          href={useBaseUrl('docs/v1/walkthrough/quick-start')}
        >
          Quick Start!
        </QuickStart>
      </LogoWrapper>
      <NameWrapper url={textureUrl}>
        <Name>edux</Name>
        <TaglineLight>
          {tagline
            .slice(middleChar)
            .split('')
            .map((char, index) => (
              <TaglineChar
                {...getTaglineAnimation(middleChar + index)}
                key={index}
              >
                {char === ' ' ? <>&nbsp;</> : char}
              </TaglineChar>
            ))}
        </TaglineLight>
        <ApiDocs
          {...getAnimation(1)}
          href={useBaseUrl('docs/v1/api/api-overview')}
        >
          API Docs
        </ApiDocs>
        <GraphAnimation />
      </NameWrapper>
    </Wrapper>
  )
}
