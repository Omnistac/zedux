import useBaseUrl from '@docusaurus/useBaseUrl'
import usePrismTheme from '@theme/hooks/usePrismTheme'
import Highlight, { Prism } from 'prism-react-renderer'
import React, { FC, useEffect, useState } from 'react'
import Editor from 'react-simple-code-editor'
import styled, { keyframes } from 'styled-components'
import * as ReactZedux from '../../packages/react/src'
import * as Redux from 'redux'
;(window as any).ReactZedux = ReactZedux
;(window as any).Redux = Redux

let theme

const slide = keyframes`
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(128px, 128px);
  }
`

const Header = styled.div<{ url: string }>`
  background: var(--color-dark);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
  padding: 0.5rem 1rem;
  position: relative;

  &::before {
    animation: ${slide} 40s infinite linear;
    background: ${({ url }) => `url(${url})`} 0 0 repeat;
    content: '';
    height: calc(100% + 128px);
    position: absolute;
    left: -128px;
    top: -128px;
    width: calc(100% + 128px);
  }
`

const Img = styled.img`
  display: inline-block;
  margin-right: 0.5rem;
  vertical-align: middle;
  width: 2rem;
`

const ResultText = styled.div<{ url: string }>`
  background: var(--color-dark);
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 0;
  border-bottom: 0;
  overflow: hidden;
  position: relative;

  &::before {
    animation: ${slide} 40s infinite linear;
    background: ${({ url }) => `url(${url})`} 0 0 repeat;
    content: '';
    height: calc(100% + 128px);
    position: absolute;
    left: -128px;
    top: -128px;
    width: calc(100% + 128px);
  }
`

const ResultView = styled.div`
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-top: 0;
  border-radius: 0 0 10px 10px;
  color: #242526;
  line-height: 2.2;
  padding: 0.5rem 1rem;
`

const Wrapper = styled.section`
  color: #fff;
  margin: 2rem 0;
`

const scope = {
  ...ReactZedux,
  ...React,
}
const scopeKeys = Object.keys(scope)
const scopeValues = scopeKeys.map(key => scope[key])

const evalCode = (code: string, resultVarName: string) => {
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'React',
    ...scopeKeys,
    `var ${resultVarName}; ${code}; return typeof ${resultVarName} === 'function' ? React.createElement(${resultVarName}) : ${resultVarName}`
  )

  return fn.call(null, React, ...scopeValues)
}

class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  UNSAFE_componentWillReceiveProps() {
    this.setState({ hasError: false })
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <span>...</span>
    }

    return this.props.children || <span />
  }
}

const Highlighter = code => (
  <Highlight Prism={Prism} code={code} language="typescript" theme={theme}>
    {({ tokens, getLineProps, getTokenProps }) => (
      <>
        {tokens.map((line, i) => (
          // eslint-disable-next-line react/jsx-key
          <div {...getLineProps({ line, key: i })}>
            {line.map((token, key) => {
              let tokenProps

              try {
                tokenProps = getTokenProps({ token, key })
              } catch (err) {
                return <span>{token.content}</span>
              }

              return (
                // eslint-disable-next-line react/jsx-key
                <span {...tokenProps} />
              )
            })}
          </div>
        ))}
      </>
    )}
  </Highlight>
)

export const LiveEditor: FC<{ extraScope?: string; resultVar?: string }> = ({
  children,
  extraScope,
  resultVar = 'Result',
}) => {
  const [tsCode, setTsCode] = useState((children as string).trim())
  const [result, setResult] = useState('')
  const bgUrl = useBaseUrl('img/bg-texture.png')
  theme = usePrismTheme()

  useEffect(() => {
    try {
      ReactZedux.wipe()
      const jsCode = (window as any).ts.transpile(`${extraScope}; ${tsCode}`, {
        jsx: 'react',
      })
      const evalResult = evalCode(jsCode, resultVar)
      setResult(evalResult)
    } catch (err) {
      setResult(err.message)
      console.error('Live Editor error:', err)
    }
  }, [resultVar, tsCode])

  return (
    <Wrapper>
      <Header url={bgUrl}>
        <Img src={useBaseUrl('img/zedux-icon.png')} /> Live Editor
      </Header>
      <Editor
        value={tsCode}
        padding={10}
        highlight={Highlighter}
        onValueChange={setTsCode}
        style={{
          fontFamily: 'monospace',
          lineHeight: '1.4',
          whiteSpace: 'pre',
          ...theme.plain,
        }}
      />
      <ResultText url={bgUrl}>
        <Img src={useBaseUrl('img/zedux-icon.png')} /> Live Result:
      </ResultText>
      <ResultView>
        <ErrorBoundary>{result}</ErrorBoundary>
      </ResultView>
    </Wrapper>
  )
}