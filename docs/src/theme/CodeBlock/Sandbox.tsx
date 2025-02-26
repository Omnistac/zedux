import { usePrismTheme } from '@docusaurus/theme-common'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Prism from 'prismjs'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Text,
  createEditor,
  Descendant,
  BaseElement,
  Element,
  NodeEntry,
  Path,
  BaseRange,
  Range,
} from 'slate'
import { withHistory } from 'slate-history'
import { Slate, withReact, ReactEditor, RenderLeafProps } from 'slate-react'
import { JsxEmit, transpile } from 'typescript/lib/typescript'
import * as RxJS from 'rxjs'
import * as RxJSOperators from 'rxjs/operators'
import * as ZeduxImmer_v1 from '@zedux.v1/immer'
import * as ZeduxMachines_v1 from '@zedux.v1/machines'
import * as ZeduxReact_v1 from '@zedux.v1/react'
import * as ZeduxImmer_v2 from '@zedux.v2/immer'
import * as ZeduxMachines_v2 from '@zedux.v2/machines'
import * as ZeduxReact_v2 from '@zedux.v2/react'
import { LogActions } from './LogActions'
import { onKeyDown, scrollSelectionIntoView } from './editorUtils'
import {
  EditorWrapper,
  Gutter,
  Header,
  HeaderActions,
  HeaderText,
  ResetButton,
  Result,
  StyledEditable,
  Wrapper,
} from './styles'

declare module 'slate' {
  interface CustomTypes {
    // ?? slate's types wrong..
    Element: { type: string } & BaseElement
    Editor: ReactEditor
    Text: { text: string; tokenType?: string }
    Range: { tokenType?: string } & BaseRange
  }
}

const Zedux_v1 = { ...ZeduxReact_v1, ...ZeduxImmer_v1, ...ZeduxMachines_v1 } // resolves all the getters
const Zedux_v2 = { ...ZeduxReact_v2, ...ZeduxImmer_v2, ...ZeduxMachines_v2 } // resolves all the getters

const getScope = (version: string) => {
  const scope = {
    ...RxJS,
    ...RxJSOperators,
    ...(version === '1' ? Zedux_v1 : Zedux_v2),
    ...React,
    window:
      typeof window === 'undefined'
        ? { addEventListener() {}, removeEventListener() {} }
        : window,
  }
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map(key => scope[key])

  return { scopeKeys, scopeValues }
}

const decorateTokens = (
  path: Path,
  tokens: ReturnType<typeof Prism.tokenize>,
  params: { ranges: Range[]; start: number },
  parentType?: string
) => {
  for (const token of tokens) {
    const end = params.start + token.length

    if (typeof token === 'string') {
      if (parentType) {
        params.ranges.push({
          anchor: { path, offset: params.start },
          focus: { path, offset: end },
          tokenType: parentType,
        })
      }

      params.start = end

      continue
    }

    if (typeof token.content === 'string' || !Array.isArray(token.content)) {
      params.ranges.push({
        anchor: { path, offset: params.start },
        focus: { path, offset: end },
        tokenType: token.type,
      })

      params.start = end

      continue
    }

    decorateTokens(path, token.content, params, token.type)
  }

  return params.ranges
}

const decorate = ([node, path]: NodeEntry) => {
  if (!Text.isText(node)) {
    return []
  }

  const tokens = Prism.tokenize(node.text, Prism.languages.tsx)

  return decorateTokens(path, tokens, { ranges: [], start: 0 })
}

const evalCode = (
  code: string,
  resultVarName: string,
  version: string,
  extraSandboxScope?: Record<string, any>,
  localStorage?: typeof window.localStorage,
  reload?: () => void
) => {
  const { scopeKeys, scopeValues } = getScope(version)

  const extraScope = {
    ...extraSandboxScope,
    localStorage,
    sandbox: { reload },
  }
  const resultStr = `var ${resultVarName}; ${code}; var _$_$res = typeof ${resultVarName} === 'function' ? React.createElement(${resultVarName}) : typeof ${resultVarName} === 'string' ? ${resultVarName} : React.createElement('pre', null, JSON.stringify(${resultVarName}, null, 2));`
  const wrapped = `${resultStr} return _$_$res`

  const extraScopeKeys = extraScope ? [...Object.keys(extraScope)] : []
  const keys = extraScope ? [...scopeKeys, ...extraScopeKeys] : scopeKeys
  const vals = extraScope
    ? [...scopeValues, ...extraScopeKeys.map(key => extraScope[key])]
    : scopeValues

  // eslint-disable-next-line no-new-func
  const fn = new Function('React', ...keys, wrapped)
  const result = fn.call(null, React, ...vals)

  return result
}

const parse = (text: string): Descendant[] =>
  text
    .split('\n')
    .slice(0, -1)
    .map(line => ({
      type: 'paragraph',
      children: [{ text: line }],
    }))

const serialize = (nodes: Descendant[]) =>
  nodes
    .map(node =>
      (node as Element).children.map(child => (child as Text).text).join('')
    )
    .join('\n')

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

  render(): any {
    // idk y
    if (this.state.hasError) {
      return <span>...</span>
    }

    return this.props.children || <span />
  }
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  return (
    <span className={`token ${leaf.tokenType || ''}`} {...attributes}>
      {children}
    </span>
  )
}

export const Sandbox = ({
  children,
  ecosystemId,
  extraScope,
  noProvide,
  resultVar = 'Result',
  version = '1',
}: {
  children: string
  ecosystemId?: string
  extraScope?: string | Record<string, any>
  noProvide?: string
  resultVar?: string
  version?: string
}) => {
  const localStorage = useMemo(() => {
    const localStorageObj = {}
    return {
      clear: () =>
        Object.keys(localStorageObj).forEach(key => {
          delete localStorageObj[key]
        }),
      getItem: (key: string) => localStorageObj[key],
      get length() {
        return Object.keys(localStorageObj).length
      },
      key: (index: number) => Object.keys(localStorageObj)[index],
      removeItem: (key: string) => {
        delete localStorageObj[key]
      },
      setItem: (key: string, val: any) => (localStorageObj[key] = val),
    }
  }, [])
  const { baseUrl } = useDocusaurusContext().siteConfig
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const initialValue = useMemo(() => parse(children), [])
  const [value, setValue] = useState(initialValue)
  const [result, setResult] = useState('')
  const theme = usePrismTheme()
  const lastLoggedErrorTimeRef = useRef<number | undefined>()
  const isMountedRef = useRef(true)
  const isResettingRef = useRef(false)

  const Zedux = version === '1' ? Zedux_v1 : Zedux_v2

  const [ecosystem] = useState(() =>
    noProvide
      ? undefined
      : Zedux.createEcosystem(ecosystemId ? { id: ecosystemId } : undefined)
  )

  const reset = (rawVal: Descendant[], text = 'resetting') => {
    isResettingRef.current = true
    setResult(`... ${text} ...`)

    setTimeout(() => {
      isResettingRef.current = false
      runCode(rawVal)
    }, 400)
  }

  const runCode = useCallback(
    (rawVal: Descendant[]) => {
      if (isResettingRef.current) return

      const val = serialize(rawVal)

      try {
        const extraScopeStr = typeof extraScope === 'string' ? extraScope : ''
        const jsCode = transpile(`${extraScopeStr}; ${val}`, {
          jsx: JsxEmit.React,
        })

        if (!jsCode) return

        if (
          version === '1'
            ? ecosystem &&
              Object.keys((ecosystem as ZeduxReact_v1.Ecosystem)._instances)
                .length
            : (ecosystem as ZeduxReact_v2.Ecosystem)?.n.size
        ) {
          // if (ecosystem && Object.keys(ecosystem?.n).length) {
          ecosystem.reset()
          ecosystem.setOverrides([])
        }

        const evalResult = evalCode(
          jsCode,
          resultVar,
          version,
          typeof extraScope === 'string' ? undefined : extraScope,
          localStorage,
          () => reset(rawVal, 'refreshing sandbox')
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

        console.error('Live Sandbox error:', err)
        lastLoggedErrorTimeRef.current = Date.now()
      }
    },
    [ecosystemId, extraScope, resultVar]
  )

  // run initial code on mount (or if runCode changes - shouldn't happen)
  useEffect(() => {
    runCode(value)
  }, [runCode])

  const slate = (
    <Slate
      editor={editor}
      onChange={newValue => {
        if (newValue === value) return

        setValue(newValue)
        runCode(newValue)
      }}
      value={value}
    >
      <Wrapper>
        <Header>
          <img src={`${baseUrl}img/zedux-icon-75x75.png`} />
          <HeaderText>Live Sandbox</HeaderText>
          <HeaderActions>
            <LogActions ecosystem={ecosystem} Zedux={Zedux} />
            <ResetButton
              onClick={() => {
                localStorage.clear()
                setValue(initialValue)
                editor.children = initialValue
                reset(initialValue)
              }}
            >
              Reset
            </ResetButton>
          </HeaderActions>
        </Header>
        <EditorWrapper>
          <Gutter>
            {value.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </Gutter>
          <StyledEditable
            decorate={decorate}
            onKeyDown={event => onKeyDown(editor, event)}
            placeholder="Write some code..."
            renderLeaf={Leaf}
            scrollSelectionIntoView={scrollSelectionIntoView}
            $sscProps={theme}
          />
        </EditorWrapper>
        <Result>
          <ErrorBoundary>{result}</ErrorBoundary>
        </Result>
      </Wrapper>
    </Slate>
  )

  return noProvide ? (
    slate
  ) : (
    <Zedux.EcosystemProvider ecosystem={ecosystem as never}>
      {/*
      @ts-expect-error We're loading multiple React versions for the different
      Zedux versions. React's `children` (`ReactNode`) prop type isn't
      compatible with itself across versions
    */}
      {slate as any}
    </Zedux.EcosystemProvider>
  )
}
