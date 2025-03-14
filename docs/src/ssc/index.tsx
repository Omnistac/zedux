import React, {
  ComponentPropsWithRef,
  ComponentType,
  CSSProperties,
  createContext,
  FC,
  forwardRef,
  PropsWithChildren,
  useContext,
  useMemo,
  useRef,
} from 'react'

enum Mode {
  Group = 'group',
  Key = 'key',
  Root = 'root',
  Val = 'val',
}

interface Group {
  groupStack?: number[]
  mediaQuery?: string
  props: [string, string][]
  selectors?: string[]
}

export type Styleable = keyof JSX.IntrinsicElements | ComponentType<StylerProps>

export type Styled<C extends Styleable> = <
  Props extends Record<string, any> = StylerProps
>(
  templateArr: TemplateStringsArray,
  ...args: StyledArgs<Props & StyledProps>[]
) => StyledComponent<Props & ComponentPropsWithRef<C>>

export type StyledComponent<Props extends Record<string, any>> = FC<Props> & {
  componentClassName: string
}

export type StyledArgs<Props extends Record<string, any>> =
  | StyledArgsType
  | ((props: Props) => StyledArgsType)

export type StyledProps = PropsWithChildren<{
  className?: string
  theme: DefaultTheme
}>

export type StylerProps = PropsWithChildren<{
  className?: string
  theme?: DefaultTheme
}>

export type Styles<Props extends Record<string, any>> =
  | StylesType
  | ((props: Props) => StylesType)

type StyledArgsType =
  | { componentClassName: string }
  | { toString(): string }
  | string
  | false
  | null
  | undefined
  | number

type StyledFactory = {
  <C extends Styleable>(Wrapped: C): Styled<C>
} & {
  [K in keyof JSX.IntrinsicElements]: Styled<K>
}

type StylesType = TemplateStringsArray | string | CSSProperties

class Parser {
  private pos = 0
  private groupStack = [0]
  private currentGroupSelectors = ['']
  private currentKey = ''
  private currentVal = ''
  private mode = Mode.Root
  public groups: Group[] = [{ props: [] }]

  constructor(private str: string, private placeholder: string) {
    let next: string
    while ((next = this.str[this.pos++])) {
      if (next === '/') {
        if (this.str[this.pos] === '/') {
          this.readSingleLineComment()
          continue
        }
        if (this.str[this.pos] === '*') {
          this.readMultilineComment()
          continue
        }
      }
      this[this.mode](next)
    }
  }

  group(next: string) {
    if (/['"`]/.test(next)) {
      return (this.currentGroupSelectors[
        this.currentGroupSelectors.length - 1
      ] += this.readString(next))
    }
    if (next === '&') {
      return (this.currentGroupSelectors[
        this.currentGroupSelectors.length - 1
      ] += this.placeholder)
    }
    if (next === ',') return this.currentGroupSelectors.push('')
    if (next !== '{') {
      return (this.currentGroupSelectors[
        this.currentGroupSelectors.length - 1
      ] += next)
    }

    this.groups.push({
      groupStack: [...this.groupStack],
      mediaQuery:
        this.groups[this.groupStack[this.groupStack.length - 1]].mediaQuery,
      selectors: this.currentGroupSelectors.map(selector => selector.trim()),
      props: [],
    })
    this.groupStack.push(this.groups.length - 1)
    this.mode = Mode.Root
  }

  key(next: string) {
    if (next === '{') {
      this.currentGroupSelectors = ['']
      this.pos -= this.currentKey.length
      return (this.mode = Mode.Group)
    }
    if (next !== ':') return (this.currentKey += next)

    this.mode = Mode.Val
    this.currentVal = ''
  }

  readMultilineComment() {
    const nextIndex = this.str.indexOf('*/', this.pos + 1)
    this.pos = nextIndex + 2
  }

  readSingleLineComment() {
    const nextIndex = this.str.indexOf('\n', this.pos)
    this.pos = nextIndex + 1
  }

  readString(delimiter: string, isParen = false) {
    const nextIndex = this.str.indexOf(delimiter, this.pos)
    const str = this.str.slice(this.pos, nextIndex)
    this.pos = nextIndex + 1
    return `${isParen ? '' : delimiter}${str}${isParen ? '' : delimiter}`
  }

  root(next: string) {
    if (/[a-zA-Z-]/.test(next)) {
      this.mode = Mode.Key
      return (this.currentKey = next)
    }
    if (next === '&') {
      this.currentGroupSelectors = [this.placeholder]
      return (this.mode = Mode.Group)
    }
    if (groupStartTokens.includes(next)) {
      this.currentGroupSelectors = [`${this.placeholder} ${next}`]
      return (this.mode = Mode.Group)
    }
    if (next === '}') return this.groupStack.pop()
    if (next === '@') {
      const endIndex = this.str.indexOf('{', this.pos)

      this.groups.push({
        ...this.groups[this.groups.length - 1],
        mediaQuery: `@${this.str.slice(this.pos, endIndex)}`,
        props: [],
      })
      this.groupStack.push(this.groups.length - 1)

      return (this.pos = endIndex + 1)
    }
  }

  val(next: string) {
    if (/['"`]/.test(next)) return (this.currentVal += this.readString(next))
    if (next === '(') {
      return (this.currentVal += next + this.readString(')', true) + ')')
    }
    if (next === '{') {
      this.currentGroupSelectors = ['']
      this.pos -= this.currentKey.length + this.currentVal.length
      return (this.mode = Mode.Group)
    }
    if (next !== ';' && next !== '}') return (this.currentVal += next)

    this.groups[this.groupStack[this.groupStack.length - 1]].props.push([
      this.currentKey.trim(),
      this.currentVal.trim(),
    ])
    this.mode = Mode.Root
  }
}

const createStyleManager = (
  root?: Element,
  id = Math.random().toString(16).slice(2, 14),
  styleTag?: HTMLStyleElement
) => {
  let idCounter = 0
  const generateClassName = () => `s${id}${idCounter++}`
  const managerKeyframes = {}
  const replaceStr = `REPLACEWITHCLASS${id}`
  const cachedClassNames: Record<
    string,
    { className: string; groups: Group[]; refCount: number }
  > = {}

  const renderStyles = () => {
    const styles = Object.values(cachedClassNames)
      .map(({ className, groups }) =>
        groups
          .map(
            ({
              groupStack = [],
              mediaQuery,
              props,
              selectors = [`.${className}`],
            }) => {
              const propsStr = props
                .map(([key, val]) => `${key}:${val}`)
                .join(';')

              const stackSelectors = groupStack.map(
                index => groups[index].selectors || [`.${className}`]
              )
              stackSelectors.push(selectors)
              const fullyQualifiedSelectors = stackSelectors.reduce(
                (parentSelectors, groupSelectors) => {
                  if (!parentSelectors.length) return groupSelectors

                  return parentSelectors.reduce(
                    (combinedSelectors, parentSelector) => {
                      combinedSelectors.push(
                        ...groupSelectors.map(
                          selector =>
                            `${selector.replace(replaceStr, parentSelector)}`
                        )
                      )
                      return combinedSelectors
                    },
                    [] as string[]
                  )
                },
                [] as string[]
              )

              const block = fullyQualifiedSelectors
                .map(selector => `${selector}{${propsStr}}`)
                .join('\n')

              return mediaQuery ? `${mediaQuery}{${block}}` : block
            }
          )
          .join('\n')
      )
      .join('\n')

    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.dataset.ssc = 'active'

      if (typeof document !== 'undefined') {
        ;(root || document.head).appendChild(styleTag)
      }
    }

    const keyframeDefs = Object.values(keyframesCache)
      .map(defs =>
        Object.entries(defs)
          .map(([key, def]) => `@keyframes ${key}{${def}}`)
          .join('\n')
      )
      .join('\n')

    styleTag.innerHTML = `${keyframeDefs}${styles}`
  }

  return <Props extends Record<string, any>>(
    styles: Styles<Props>,
    args: StyledArgs<Props>[],
    props: Props,
    oldRawStr?: string
  ) => {
    currentProps = props
    keyframesCache = managerKeyframes
    const rawStr = resolveTemplate(styles, args)
    const oldCache = oldRawStr && cachedClassNames[oldRawStr]
    let cache = cachedClassNames[rawStr]
    let hasChanges = false

    if (cache) cache.refCount++
    if (oldCache && oldCache !== cache) {
      oldCache.refCount--

      if (oldCache.refCount === 0) {
        delete cachedClassNames[oldRawStr as any]
        hasChanges = true
      }
    }

    if (cache) {
      if (hasChanges) renderStyles()
      return [cache.className, rawStr]
    }

    const className = generateClassName()
    const { groups } = new Parser(rawStr, replaceStr)

    cache = {
      className,
      groups,
      refCount: 1,
    }
    cachedClassNames[rawStr] = cache

    renderStyles()
    return [cache.className, rawStr]
  }
}

let currentProps: Record<string, any> = {}
let globalIdCounter = 0
let keyframesCache: Record<string, Record<string, string>> = {}
const cachedManagers: Record<string, ReturnType<typeof createStyleManager>> = {}
const groupStartTokens = '.#>+~[:'
const reservedProp = '$sscProps'
const specialProps = { children: 1, htmlFor: 1, key: 1, ref: 1, theme: 1 }
const styleManagerContext = createContext({
  getClassName: createStyleManager(),
  theme: {} as DefaultTheme,
})

const filterProps = (Wrapped: any, props: Record<string, any>) => {
  if (typeof window === 'undefined' || typeof Wrapped !== 'string') {
    if (!props[reservedProp]) return props

    const clonedProps = { ...props }
    delete clonedProps[reservedProp]
    return clonedProps
  }

  return Object.keys(props)
    .filter(prop => {
      if (specialProps[prop as keyof typeof specialProps]) return true
      if (prop[0] === '$') return false

      const el =
        window[
          `HTML${Wrapped[0].toUpperCase()}${Wrapped.slice(1)}Element` as any
        ] || window[`HTML${Wrapped.toUpperCase()}Element` as any]

      return !el || prop.toLowerCase() in (el as any).prototype
    })
    .reduce((newProps, key) => {
      newProps[key] = props[key]
      return newProps
    }, {} as Record<string, any>)
}

const resolveTemplate = <Props extends Record<string, any>>(
  styles: Styles<Props>,
  args: StyledArgs<Props>[]
) => {
  if (typeof styles === 'string') return styles
  if (typeof styles === 'function')
    return resolveTemplate(styles(currentProps as Props), [])

  if (!Array.isArray(styles)) {
    return Object.entries(styles).reduce(
      (str, [prop, val]) =>
        `${str}${prop.replace(/[A-Z]/g, '-$&').toLowerCase()}:${val};`,
      ''
    )
  }

  return styles
    .map((str, i) => {
      if (i === 0) return str

      let arg = args[i - 1]

      while (typeof arg !== 'string') {
        if (arg == null) {
          arg = ''
          break
        }

        arg = (arg as any).componentClassName
          ? `.${(arg as any).componentClassName}`
          : typeof arg === 'function'
          ? (arg as any)(currentProps as Props)
          : (arg as any).toString() ?? ''
      }

      return `${arg}${str}`
    })
    .join('')
}

const styled: StyledFactory = ((Wrapped: any) => {
  const newStyled = (styles: Styles<any>, ...args: any) => {
    const Component: any = forwardRef((props: any, ref: any) => {
      const prevRawStr = useRef<string>()
      const prevProps = useRef<any>(props)
      const { getClassName, theme } = useContext(styleManagerContext)

      const stableProps = useMemo(() => {
        if (
          Object.entries(props).every(
            ([key, val]) => prevProps.current[key] === val
          )
        ) {
          return prevProps.current
        }

        prevProps.current = props
        return props
      }, [props])

      const ownClassName = useMemo(() => {
        const [newClassName, rawStr] = getClassName(
          styles,
          args,
          { theme, ...props },
          prevRawStr.current
        )
        prevRawStr.current = rawStr

        return newClassName
      }, [stableProps, theme])

      const filteredProps = filterProps(Wrapped, props)

      const classNames = [
        Component.componentClassName,
        ownClassName,
        props.className,
      ].filter(Boolean)

      return (
        <Wrapped
          {...filteredProps}
          className={classNames.join(' ')}
          ref={ref}
        />
      ) as any
    })

    const wrappedName =
      typeof Wrapped === 'string'
        ? Wrapped
        : (Wrapped as any).displayName || (Wrapped as any).name || 'unknown'

    Component.displayName = `styled-${wrappedName}` // lol parens breaks vscode syntax highlighting
    Component.componentClassName = `${wrappedName}${globalIdCounter++}`

    return Component
  }

  return newStyled
}) as StyledFactory

export default new Proxy(styled, {
  get: (styled, prop) => {
    if (prop in styled) {
      return styled[prop as keyof typeof styled]
    }

    const StyledComponent = styled(prop as keyof JSX.IntrinsicElements)
    styled[prop as keyof typeof styled] = StyledComponent
    return StyledComponent
  },
})

export const css = <Props extends Record<string, any>>(
  styles: Styles<Props>,
  ...args: StyledArgs<Props>[]
) => ({
  toString: () => resolveTemplate<Props>(styles, args),
})

export const keyframes = <Props extends Record<string, any>>(
  styles: Styles<Props>,
  ...args: StyledArgs<Props>[]
) => {
  const baseId = `keyframe${globalIdCounter++}`

  return {
    toString: () => {
      const str = resolveTemplate<Props>(styles, args)

      if (keyframesCache[baseId]) {
        const key = Object.keys(keyframesCache[baseId]).find(
          key => keyframesCache[baseId][key] === str
        )

        if (key) return key
      } else {
        keyframesCache[baseId] = {}
      }

      const keyframeId = `${baseId}-${globalIdCounter++}`
      keyframesCache[baseId][keyframeId] = str
      return keyframeId
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultTheme {}

export const dehydrate = () => cachedManagers

globalThis.dehydrateSsc = dehydrate

export const ThemeProvider = ({
  children,
  id,
  root,
  styleTag,
  theme,
}: PropsWithChildren<{
  id?: string
  root?: Element
  styleTag?: HTMLStyleElement
  theme: DefaultTheme
}>) => {
  const getClassName = useMemo(() => {
    const manager = cachedManagers[id] || createStyleManager(root, id, styleTag)
    return (cachedManagers[id] = manager)
  }, [])
  const value = useMemo(() => ({ getClassName, theme }), [getClassName, theme])

  return (
    <styleManagerContext.Provider value={value}>
      {children}
    </styleManagerContext.Provider>
  )
}

export const useTheme = () => useContext(styleManagerContext).theme
