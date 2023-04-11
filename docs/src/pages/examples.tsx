import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import styled from '@site/src/ssc'
import React, { useState } from 'react'
import { BiRightArrow } from 'react-icons/bi'

const Example = styled.a<{ isActive?: boolean }>`
  align-items: center;
  border-top: 1px solid #e9e9e9;
  color: inherit;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;

  > svg {
    font-size: 1.2em;
    opacity: ${({ isActive }) => (isActive ? 1 : 0)};
    transition: opacity 0.2s;
  }

  &:hover {
    color: inherit;
    text-decoration: none;

    > svg {
      opacity: 1;
    }
  }

  &:last-of-type {
    border-bottom: 1px solid #e9e9e9;
  }
`

const Heading = styled.h3`
  background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-primary) 25px,
      transparent 25px
    ),
    linear-gradient(
      -45deg,
      var(--color-primary),
      var(--color-primary) 25px,
      transparent 25px
    );
  font-size: 2em;
  font-weight: normal;
  margin: 0;
  padding: 0.5rem 0;
  text-align: center;
`

const Iframe = styled.iframe`
  border: 0;
  height: 100%;
  overflow: hidden;
  width: 100%;
`

const Main = styled.main`
  flex: 1;
  font-size: 0;
`

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  width: 18rem;
`

const Wrapper = styled.div`
  align-items: stretch;
  display: flex;
  flex: 1;
`

const examples = {
  'zedux-counters-example-b5upgd': 'Counters',
  'zedux-todomvc-yfr2k6': 'TodoMVC',
}

export default function Examples() {
  const path =
    (typeof location !== 'undefined' &&
      location.search &&
      location.search.match(/example=(.*?)&?/)?.[1]) ||
    Object.keys(examples)[0]

  const [id, setId] = useState(path)
  const { siteConfig } = useDocusaurusContext()

  if (typeof location !== 'undefined') {
    if (!location.href.search) {
      location.replace(`${location.href}?example=${id}`)
    }
  }

  return (
    <Layout
      description="Zedux is a molecular state engine for React"
      noFooter
      title={`${siteConfig.title} Examples`}
    >
      <Wrapper>
        <Sidebar>
          <Heading>Examples</Heading>
          {Object.keys(examples).map(example => (
            <Example
              key={example}
              href={`?example=${example}`}
              isActive={example === id}
              onClick={event => {
                event.preventDefault()
                setId(example)
              }}
            >
              <BiRightArrow style={{ color: 'var(--color-primary)' }} />
              {examples[example]}
            </Example>
          ))}
        </Sidebar>
        <Main>
          <Iframe
            src={`https://codesandbox.io/embed/${id}?fontsize=14&hidenavigation=1&theme=dark`}
            title={examples[id]}
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        </Main>
      </Wrapper>
    </Layout>
  )
}
