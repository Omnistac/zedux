import RawLink from '@docusaurus/Link'
import styled from 'styled-components'

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
  background-color: var(--ifm-color-primary);
  color: #fff;
  display: flex;
  padding: 4rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;

  @media screen and (max-width: 966px) {
    padding: 2rem;
  }
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

  color: var(--ifm-font-base-color-inverse);
  font-size: 1.5rem;
  margin: 0 2rem;
  padding: 0 1rem var(--border-height);
  position: relative;

  &:hover {
    color: var(--ifm-font-base-color-inverse);
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
    background: #fff;
    width: 100%;
  }
`

export const Tagline = styled.p`
  font-size: 1.5rem;
`
