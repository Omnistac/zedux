import bgUrl from '@site/static/img/bg-texture.png'
import icon from '@site/static/img/zedux-icon.png'
import usePrismTheme from '@theme/hooks/usePrismTheme'
import Highlight, { Prism } from 'prism-react-renderer'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import Editor from 'react-simple-code-editor'
import styled, { keyframes } from 'styled-components'
import { StateHub } from '../../packages/react/src/devtools'
import * as ReactZedux from '../../packages/react/src'
import * as Redux from 'redux'

import('react').then(react => {
  ;(window as any).React = react
})

const Zedux = { ...ReactZedux } // resolves all the getters

if (typeof window !== 'undefined') {
  ;(window as any).Zedux = Zedux
  ;(window as any).Redux = Redux
}

let theme

const slide = keyframes`
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(128px, 128px);
  }
`

const Button = styled.button<{ shouldHide?: boolean }>`
  @media all and (max-width: 767px) {
    ${({ shouldHide }) => (shouldHide ? 'display: none;' : '')}
  }

  appearance: none;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
  margin-left: 5px;
  padding: 5px 16px;
  position: relative;
  z-index: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const EditorWrapper = styled.div`
  overflow: auto;
`

const Header = styled.div<{ url: string }>`
  background: var(--color-dark);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
  padding: 0.5rem 1rem;
  position: relative;

  &::after {
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

const ResultText = styled.span`
  flex: 1;
`

const ResultTextWrapper = styled.div<{ url: string }>`
  align-items: center;
  background: var(--color-dark);
  display: flex;
  flex-flow: row nowrap;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 0;
  border-bottom: 0;
  overflow: hidden;
  position: relative;

  &::after {
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
  position: relative;
`

const Wrapper = styled.section`
  box-shadow: 10px 10px 7px rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  color: #fff;
  margin: 2rem 0;
`

const scope = {
  ...Zedux,
  ...React,
}
const scopeKeys = Object.keys(scope)
const scopeValues = scopeKeys.map(key => scope[key])

const evalCode = (
  ecosystemId: string,
  code: string,
  resultVarName: string,
  extraScope?: Record<string, any>
) => {
  const resultStr = `var ${resultVarName}; ${code}; var _$_$res = typeof ${resultVarName} === 'function' ? React.createElement(${resultVarName}) : ${resultVarName};`
  const wrapped = `${resultStr} return _$_$res`

  const extraScopeKeys = extraScope ? [...Object.keys(extraScope)] : []
  const keys = extraScope ? [...scopeKeys, ...extraScopeKeys] : scopeKeys
  const vals = extraScope
    ? [...scopeValues, ...extraScopeKeys.map(key => extraScope[key])]
    : scopeValues

  // eslint-disable-next-line no-new-func
  const fn = new Function('React', ...keys, wrapped)

  return fn.call(null, React, ...vals)
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
  <Highlight Prism={Prism} code={code} language="tsx" theme={theme}>
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

export const LiveEditor: FC<{
  ecosystemId: string
  extraScope?: string | Record<string, any>
  resultVar?: string
}> = ({ children, ecosystemId, extraScope, resultVar = 'Result' }) => {
  const lastLoggedErrorTimeRef = useRef<number | undefined>()
  const isMountedRef = useRef(true)
  const initialCodeRef = useRef((children as string).trim())
  const [tsCode, setTsCode] = useState((children as string).trim())
  const [result, setResult] = useState('')
  theme = usePrismTheme()

  const runCode = useCallback(
    (val: string) => {
      try {
        const extraScopeStr = typeof extraScope === 'string' ? extraScope : ''
        const jsCode = (window as any)?.ts.transpile(
          `${extraScopeStr}; ${val}`,
          {
            jsx: 'react',
          }
        )

        if (!jsCode) return

        const ecosystem = Zedux.getEcosystem(ecosystemId)
        if (Object.keys(ecosystem?._instances || {}).length) {
          ecosystem?.wipe()
        }

        const evalResult = evalCode(
          ecosystemId,
          jsCode,
          resultVar,
          typeof extraScope === 'string' ? undefined : extraScope
        )

        lastLoggedErrorTimeRef.current = undefined

        if (isMountedRef.current) setResult(evalResult)
      } catch (err) {
        if (isMountedRef.current) setResult(err.message)

        if (
          lastLoggedErrorTimeRef.current &&
          Date.now() - lastLoggedErrorTimeRef.current < 5000 // only log errors once every 5 seconds
        ) {
          return
        }

        console.error('Live Editor error:', err)
        lastLoggedErrorTimeRef.current = Date.now()
      }
    },
    [ecosystemId, resultVar]
  )

  // run initial code on mount (or if runCode changes - shouldn't happen)
  useEffect(() => {
    runCode(tsCode)
  }, [runCode])

  useEffect(
    () => () => {
      Zedux.getEcosystem(ecosystemId).destroy(true)
      isMountedRef.current = false
    },
    []
  )

  return (
    <ReactZedux.EcosystemProvider id={ecosystemId}>
      <StateHub />
      <Wrapper>
        <Header url={bgUrl}>
          <Img src={icon} /> Live Editor
        </Header>
        <EditorWrapper>
          <Editor
            value={tsCode}
            padding={10}
            highlight={Highlighter}
            onValueChange={val => {
              setTsCode(val)
              runCode(val)
            }}
            style={{
              fontFamily: 'monospace',
              fontSize: '15px',
              letterSpacing: '-0.05px',
              lineHeight: '1.4',
              minWidth: '738px',
              whiteSpace: 'pre',
              ...theme.plain,
            }}
          />
        </EditorWrapper>
        <ResultTextWrapper url={bgUrl}>
          <Img src={icon} /> <ResultText>Live Result:</ResultText>{' '}
          <Button
            onClick={() => {
              console.info('Zedux Exports:', Zedux)
              console.info('React Exports:', React)
              if (extraScope) console.info('Extra Scope:', extraScope)
            }}
            shouldHide
          >
            Log Scope
          </Button>
          <Button
            onClick={() => {
              const es = Zedux.getEcosystem(ecosystemId)

              console.info('Ecosystem:', es)
              console.info('Current State:', es.inspectInstanceValues())
            }}
            shouldHide
          >
            Log State
          </Button>
          <Button
            onClick={() => {
              setTsCode(initialCodeRef.current)
              runCode(initialCodeRef.current)
            }}
          >
            Reset
          </Button>
        </ResultTextWrapper>
        <ResultView>
          <ErrorBoundary>{result}</ErrorBoundary>
        </ResultView>
      </Wrapper>
    </ReactZedux.EcosystemProvider>
  )
}
