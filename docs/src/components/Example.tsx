import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import React from 'react'
import styled from '@site/src/ssc'
import CodeBlock from '../theme/CodeBlock'

const Text = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  max-width: 900px;
`

const Title = styled.p`
  font-size: 2rem;
`

const Wrapper = styled.section`
  align-items: center;
  background: linear-gradient(
      135deg,
      var(--color-dark) 10rem,
      transparent 10rem
    ),
    linear-gradient(-45deg, var(--color-primary) 10rem, transparent 10rem);
  display: flex;
  flex-direction: column;
  padding: 3rem;

  @media (max-width: 767px) {
    background: none;
  }
`

export const Example = () => {
  return (
    <Wrapper>
      <Text>
        <Title>As Simple As</Title>
        <CodeBlock language="tsx">{`import { atom, useAtomState } from '@zedux/react'

const greetingAtom = atom('greeting', 'Hello, World!')

function Greeting() {
  const [greeting] = useAtomState(greetingAtom)

  return <div>{greeting}</div>
}`}</CodeBlock>
        <p>
          More examples on{' '}
          <Link to={useBaseUrl('examples')}>The examples page</Link>
        </p>
      </Text>
    </Wrapper>
  )
}
