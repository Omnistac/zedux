import useBaseUrl from '@docusaurus/useBaseUrl'
import usePrismTheme from '@theme/hooks/usePrismTheme'
import Highlight, { Prism } from 'prism-react-renderer'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import Editor from 'react-simple-code-editor'
import styled, { keyframes } from 'styled-components'
import * as ReactZedux from '../../packages/react/dist/es/react/src'
import * as Redux from 'redux'

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
  const wrapped = `${resultStr} return React.createElement(EcosystemProvider, { children: _$_$res, id: '${ecosystemId}' })`

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

let idCounter = 0

export const LiveEditor: FC<{
  extraScope?: string | Record<string, any>
  resultVar?: string
}> = ({ children, extraScope, resultVar = 'Result' }) => {
  const isMountedRef = useRef(true)
  const initialCodeRef = useRef((children as string).trim())
  const [force, forceRender] = useState<any>()
  const [tsCode, setTsCode] = useState((children as string).trim())
  const [result, setResult] = useState('')
  const bgUrl = useBaseUrl('img/bg-texture.png')
  theme = usePrismTheme()

  const ecosystemId = useMemo(() => `editor-ecosystem-${idCounter++}`, [])

  const debouncedSetter = useMemo(() => {
    const data = {
      latestForce: null,
      latestVal: null,
      originalForce: null,
      originalVal: null,
      timeoutId: null,
    }

    return (newVal: string, passedForce: any) => {
      data.latestVal = newVal
      data.latestForce = passedForce
      if (data.timeoutId) return

      const run = () => {
        // already ran on the leading edge
        if (
          data.originalVal === data.latestVal &&
          data.originalForce === data.latestForce
        )
          return

        try {
          Zedux.wipe()

          const extraScopeStr = typeof extraScope === 'string' ? extraScope : ''
          const jsCode = (window as any)?.ts.transpile(
            `${extraScopeStr}; ${data.latestVal}`,
            {
              jsx: 'react',
            }
          )

          if (!jsCode) return

          const evalResult = evalCode(
            ecosystemId,
            jsCode,
            resultVar,
            typeof extraScope === 'string' ? undefined : extraScope
          )
          if (isMountedRef.current) setResult(evalResult)
        } catch (err) {
          if (isMountedRef.current) setResult(err.message)
          console.error('Live Editor error:', err)
        }
      }

      run() // run on the leading edge of the timeout
      data.originalVal = newVal
      data.originalForce = passedForce

      data.timeoutId = setTimeout(() => {
        run()

        data.timeoutId = null
      }, 500)
    }
  }, [ecosystemId])

  useEffect(() => {
    debouncedSetter(tsCode, force)
  }, [force, resultVar, tsCode])

  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    []
  )

  return (
    <Wrapper>
      <Header url={bgUrl}>
        <Img src={useBaseUrl('img/zedux-icon.png')} /> Live Editor
      </Header>
      <EditorWrapper>
        <Editor
          value={tsCode}
          padding={10}
          highlight={Highlighter}
          onValueChange={setTsCode}
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
        <Img src={useBaseUrl('img/zedux-icon.png')} />{' '}
        <ResultText>Live Result:</ResultText>{' '}
        <Button
          onClick={() => {
            console.log('Zedux Exports:', Zedux)
            console.log('React Exports:', React)
            if (extraScope) console.log('Extra Scope:', extraScope)
          }}
          shouldHide
        >
          Log Scope
        </Button>
        <Button
          onClick={() => {
            const es = Zedux.zeduxGlobalStore.getState().ecosystems[ecosystemId]

            console.log('Ecosystem:', es)
            console.log('Current State:', es.inspectInstanceValues())
          }}
          shouldHide
        >
          Log State
        </Button>
        <Button
          onClick={() => {
            setTsCode(initialCodeRef.current)
            forceRender({})
          }}
        >
          Reset
        </Button>
      </ResultTextWrapper>
      <ResultView>
        <ErrorBoundary>{result}</ErrorBoundary>
      </ResultView>
    </Wrapper>
  )
}
