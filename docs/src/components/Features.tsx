import React from 'react'
import styled from 'styled-components'
import { Cog } from './Cog'
import { Molecule } from './Molecule'
import { Atom } from './Atom'
import { Ecosystem } from './Ecosystem'

const Feature = styled.div`
  color: #fff;
  display: flex;
  gap: 3rem;
  max-width: 100%;
  padding: 3rem;
  width: 900px;

  --justify-image: flex-end;

  &:nth-of-type(2n) {
    --justify-image: flex-start;
  }
`

const FeatureImage = styled.div`
  display: flex;
  flex: 1;
  justify-content: var(--justify-image);

  & > svg {
    height: 10rem;
    width: 10rem;
  }
`

const FeatureText = styled.div`
  display: flex;
  flex-direction: column;
  flex: 2;
  gap: 1rem;
`

const FeatureTitle = styled.div`
  font-size: 1.5rem;
`

const FeatureDesc = styled.div``

const Wrapper = styled.section`
  align-items: center;
  background: var(--color-dark);
  display: flex;
  flex-direction: column;
`

export const Features = () => {
  return (
    <Wrapper>
      <Feature>
        <FeatureImage>
          <Atom />
        </FeatureImage>
        <FeatureText>
          <FeatureTitle>Atomic</FeatureTitle>
          <FeatureDesc>
            Stores are wrapped in atoms. Atoms control the lifecycle and
            visibility of application state.
          </FeatureDesc>
        </FeatureText>
      </Feature>
      <Feature>
        <FeatureText>
          <FeatureTitle>Molecular</FeatureTitle>
          <FeatureDesc>
            Atoms talk to each other. These connections form a graph. Ecosystems
            control and manipulate the graph.
          </FeatureDesc>
        </FeatureText>
        <FeatureImage>
          <Molecule />
        </FeatureImage>
      </Feature>
      <Feature>
        <FeatureImage>
          <Ecosystem />
        </FeatureImage>
        <FeatureText>
          <FeatureTitle>Composable</FeatureTitle>
          <FeatureDesc>
            Composable atoms and selectors create a dynamic architecture.
            Composable stores make state modular and flexible.
          </FeatureDesc>
        </FeatureText>
      </Feature>
      <Feature>
        <FeatureText>
          <FeatureTitle>State Engine</FeatureTitle>
          <FeatureDesc>
            Like an engine that provides the right amount of power to each
            component, Zedux provides tools for every situation.
          </FeatureDesc>
        </FeatureText>
        <FeatureImage>
          <Cog speed={10} />
        </FeatureImage>
      </Feature>
    </Wrapper>
  )
}
