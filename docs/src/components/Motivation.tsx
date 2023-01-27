import React from 'react'
import styled from '@site/src/ssc'

const P = styled.p`
  margin: 0;
  padding: 1rem 0;
`

const Text = styled.div`
  align-self: center;
  display: flex;
  flex-direction: column;
  max-width: 700px;
  padding: 1rem;
`

const Title = styled.p`
  background: var(--color-primary);
  color: #fff;
  font-size: 2rem;
  padding: 1rem;
  text-align: center;
`

const Ul = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: '- ';
  margin: 0;
  padding: 1rem;
`

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
`

export const Motivation = () => {
  return (
    <Wrapper>
      <Title>Why Does This Exist?</Title>
      <Text>
        <P>
          At Omnistac, we have to manage highly volatile state in our bond
          trading platform. After spending years fighting with Redux, we finally
          decided to look for a more powerful tool. Our &quot;power&quot;
          criteria were:
        </P>
        <Ul>
          <li>Less boilerplate (yes, even less than Redux Toolkit).</li>
          <li>Better performance.</li>
          <li>
            More granular control over selector evaluation, memoization details,
            and component rerenders.
          </li>
          <li>
            Easier integration with other systems, such as the data streaming in
            over our web sockets.
          </li>
          <li>Total control over state Time To Live and destruction.</li>
          <li>
            Lazy-loading support - esp. the ability to stream data on-demand.
          </li>
          <li>Conducive to a micro front-end architecture.</li>
          <li>Easy to migrate to incrementally (specifically from Redux).</li>
        </Ul>
        <P>
          Ideally a tool would do this without sacrificing the cool features of
          Redux like time travel and unidirectional, reproducible state updates.
        </P>
        <P>
          We trialed lots of libraries including React Query and Recoil. We
          loved React Query&apos;s QueryClient and Recoil&apos;s atomic
          architecture.
        </P>
        <P>
          Zedux is the result of years of studying the React state management
          ecosystem.
        </P>
      </Text>
    </Wrapper>
  )
}
