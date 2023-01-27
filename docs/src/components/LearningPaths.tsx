import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import React from 'react'
import styled from '@site/src/ssc'

const PathDesc = styled.div`
  text-align: center;
`

const PathSpecs = styled.div`
  align-items: center;
  display: grid;
  gap: 2rem;
  grid-template-columns: auto auto;
`

const PathTitle = styled.div`
  font-size: 1.5rem;
  text-align: center;
`

const PathWrapper = styled(Link)`
  background: linear-gradient(
    135deg,
    #fff 1rem,
    #0004 1rem,
    var(--color-primary) calc(1rem + 3px),
    var(--color-primary) 1.5rem,
    #fff 1.5rem,
    #fff 2.5rem,
    #0004 2.5rem,
    var(--color-primary) calc(2.5rem + 3px),
    var(--color-primary) 3rem,
    #fff 3rem
  );
  border-radius: var(--ifm-global-radius);
  box-shadow: 5px 5px 3px 1px #0004;
  color: var(--ifm-font-color-base);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: space-between;
  padding: 2rem;
  transform: rotateX(8deg);
  transition: transform 0.1s 0.1s;

  &:hover {
    color: var(--ifm-font-color-base);
    text-decoration: none;
    transform: rotateX(8deg) translateZ(10px);
    transition: transform 0.1s;
  }

  &:active {
    transform: rotateX(8deg) translateZ(-10px);
  }
`

const Paths = styled.div`
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 1400px;
  perspective-origin: center center;
  perspective: 20in;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    perspective: unset;
  }
`

const SpecBarDot = styled.div<{ color: string; grayscale: number }>`
  background: ${({ color }) => color};
  box-shadow: inset -6px -6px #fff3, inset -3px -3px #fff3;
  filter: grayscale(${({ grayscale }) => grayscale})
    hue-rotate(-${({ grayscale }) => grayscale * 40}deg);
  flex: 1;
`

const SpecBarWrapper = styled.div`
  background: #00000005;
  box-shadow: inset -3px -3px 5px #0001;
  display: flex;
  gap: 4px;
  height: 1.5rem;
  padding: 4px;
  transform: skew(-30deg, 0);
  width: 14rem;
`

const Title = styled.div`
  color: #fff;
  font-size: 2rem;
  text-align: center;
`

const Wrapper = styled.section`
  align-items: center;
  background: var(--color-primary)
    repeating-radial-gradient(
      circle at 100% 0,
      transparent,
      transparent 14.142136rem,
      #fff5 28.284272rem
    );
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 3rem;
`

const SpecBar = ({
  grayscale,
  percent,
}: {
  grayscale: number
  percent: number
}) => {
  return (
    <SpecBarWrapper>
      {Array(10)
        .fill(null)
        .map((_, i) => (
          <SpecBarDot
            key={i}
            color={i / 10 < percent ? 'var(--color-primary)' : '#00000005'}
            grayscale={grayscale}
          />
        ))}
    </SpecBarWrapper>
  )
}

const Path = ({
  applicable,
  children,
  depth,
  ease,
  fun,
  href,
  title,
}: {
  applicable: number
  children: string
  depth: number
  ease: number
  fun: number
  href: string
  title: string
}) => {
  return (
    <PathWrapper to={href}>
      <PathTitle>{title}</PathTitle>
      <PathDesc>{children}</PathDesc>
      <PathSpecs>
        <span>Fun</span>
        <SpecBar grayscale={0} percent={fun / 10} />
        <span>Detailed</span>
        <SpecBar grayscale={0.25} percent={depth / 10} />
        <span>Easy</span>
        <SpecBar grayscale={0.5} percent={ease / 10} />
        <span>Applicable</span>
        <SpecBar grayscale={0.75} percent={applicable / 10} />
      </PathSpecs>
    </PathWrapper>
  )
}

export const LearningPaths = () => {
  return (
    <Wrapper>
      <Title>Learn Zedux</Title>
      <Paths>
        <Path
          applicable={9}
          depth={5}
          ease={7}
          fun={9}
          href={useBaseUrl('tutorial')}
          title="Tutorial"
        >
          Build a real app with Zedux
        </Path>
        <Path
          applicable={6}
          depth={8}
          ease={8}
          fun={6}
          href={useBaseUrl('docs/walkthrough/quick-start')}
          title="Walkthrough"
        >
          Take a gentle journey through Zedux&apos; features
        </Path>
        <Path
          applicable={4}
          depth={10}
          ease={2}
          fun={1}
          href={useBaseUrl('docs/api/classes/Atom')}
          title="API"
        >
          Dive into the comprehensive API docs
        </Path>
        <Path
          applicable={10}
          depth={4}
          ease={5}
          fun={7}
          href={useBaseUrl('examples')}
          title="Examples"
        >
          Play with real Zedux code
        </Path>
        <Path
          applicable={5}
          depth={3}
          ease={10}
          fun={8}
          href={useBaseUrl('videos')}
          title="Videos"
        >
          Watch people talk about Zedux
        </Path>
        <Path
          applicable={1}
          depth={9}
          ease={2}
          fun={3}
          href="https://github.com/Omnistac/zedux"
          title="Source Code"
        >
          Peruse the Zedux source code and tests
        </Path>
      </Paths>
    </Wrapper>
  )
}
