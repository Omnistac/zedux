import RawLink from '@docusaurus/Link'
import styled, { keyframes } from 'styled-components'

export const Buttons = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
`

export const Features = styled.section`
  align-items: center;
  display: flex;
  padding: 2rem 0;
  width: 100%;
`

export const FeatureImage = styled.img`
  height: 200px;
  width: 200px;
`

export const H1 = styled.h1`
  font-size: 4rem;
  font-weight: normal;
`

export const Header = styled.header`
  align-items: center;
  color: #fff;
  display: flex;
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

export const HeaderContent = styled.div`
  z-index: 1;
`

export const Link = styled(RawLink)`
  @keyframes move {
    0% {
      opacity: 1;
      width: 100%;
    }
    25% {
      left: 100%;
      width: 0%;
    }
    25.0001% {
      left: 0;
    }
    50% {
      width: 100%;
      opacity: 0.3;
    }
    100% {
      opacity: 1;
    }
  }

  --border-height: 3px;

  color: var(--ifm-color-primary-dark);
  font-size: 1.5rem;
  margin: 0 2rem;
  padding: 0 1rem var(--border-height);
  position: relative;

  &:hover {
    color: var(--ifm-color-primary-dark);
    text-decoration: none;

    &::before {
      animation: move 2s infinite ease;
    }
  }

  &::before {
    border-radius: 10px;
    bottom: 0;
    content: '';
    height: var(--border-height);
    left: 0;
    position: absolute;
    transition: width 0.2s;
  }

  &::before {
    background: var(--ifm-color-primary-dark);
    width: 100%;
  }
`

const slide = keyframes`
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(128px, 128px);
  }
`

export const SlidingBg = styled.div<{ url: string }>`
  animation: ${slide} 60s infinite linear;
  background: ${({ url }) => `url(${url})`} var(--color-dark);
  height: calc(100% + 128px);
  position: absolute;
  top: -128px;
  left: -128px;
  width: calc(100% + 128px);
  z-index: 0;
`

export const Tagline = styled.p`
  font-size: 1.5rem;
`
