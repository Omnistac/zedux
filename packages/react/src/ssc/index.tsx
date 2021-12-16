import React, {
  ComponentPropsWithRef,
  ComponentType,
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
  props: [string, string][]
  selectors?: string[]
}

export type Styleable = keyof JSX.IntrinsicElements | ComponentType<StylerProps>

export type Styled<C extends Styleable> = <
  Props extends Record<string, any> = StylerProps
>(
  templateArr: TemplateStringsArray,
  ...args: StyledArgs<Props & ComponentPropsWithRef<C> & StyledProps>[]
) => StyledComponent<Props & ComponentPropsWithRef<C>>

export type StyledComponent<Props extends Record<string, any>> = FC<Props> & {
  componentClassName: string
}

export type StyledArgs<Props extends Record<string, any>> =
  | ((props: Props) => StyledArgs<Props>)
  | { componentClassName: string }
  | string
  | false
  | null
  | undefined
  | number

export type StyledProps = PropsWithChildren<{
  className?: string
  theme: DefaultTheme
}>

export type StylerProps = PropsWithChildren<{
  className?: string
  theme?: DefaultTheme
}>

type StyledFactory = {
  <C extends Styleable>(Wrapped: C): Styled<C>
} & {
  [K in keyof JSX.IntrinsicElements]: Styled<K>
}

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
      selectors: this.currentGroupSelectors.map(selector => selector.trim()),
      props: [],
    })
    this.groupStack.push(this.groups.length - 1)
    this.mode = Mode.Root
  }

  key(next: string) {
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

  readString(delimiter: string) {
    const nextIndex = this.str.indexOf(delimiter, this.pos)
    const str = this.str.slice(this.pos, nextIndex)
    this.pos = nextIndex + 1
    return `${delimiter}${str}${delimiter}`
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
    if (next === '#' || next === '.' || next === '[') {
      this.currentGroupSelectors = [next]
      return (this.mode = Mode.Group)
    }
    if (next === '}') return this.groupStack.pop()
  }

  val(next: string) {
    if (/['"`]/.test(next)) return (this.currentVal += this.readString(next))
    if (next !== ';') return (this.currentVal += next)

    this.groups[this.groupStack[this.groupStack.length - 1]].props.push([
      this.currentKey.trim(),
      this.currentVal.trim(),
    ])
    this.mode = Mode.Root
  }
}

const createStyleManager = (
  root: Pick<Element, 'appendChild'> = typeof window === 'undefined'
    ? { appendChild: n => n }
    : document.head
) => {
  let idCounter = 0
  let styleTag: HTMLStyleElement
  const id = btoa(Math.random().toString()).slice(3, 9)
  const generateClassName = () => `s${id}${idCounter++}`
  const replaceStr = `REPLACEWITHCLASS${id}`
  const cachedClassNames: Record<
    string,
    { className: string; groups: Group[]; refCount: number }
  > = {}

  const renderStyles = () => {
    const styles = Object.values(cachedClassNames)
      .map(({ className, groups }) =>
        groups
          .map(({ groupStack = [], props, selectors = [`.${className}`] }) => {
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

            return fullyQualifiedSelectors
              .map(selector => `${selector}{${propsStr}}`)
              .join('\n')
          })
          .join('\n')
      )
      .join('\n')

    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.dataset.ssc = 'active'

      if (typeof window !== 'undefined') {
        root.appendChild(styleTag)
      }
    }

    styleTag.innerHTML = styles
  }

  return <Props extends Record<string, any>>(
    templateArr: TemplateStringsArray,
    args: StyledArgs<Props>[],
    props: Props,
    oldRawStr?: string
  ) => {
    const rawStr = resolveTemplate(templateArr, args, props)
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

let globalIdCounter = 0
const specialProps = { children: 1, htmlFor: 1, key: 1, ref: 1, theme: 1 }
const styleManagerContext = createContext({
  getClassName: createStyleManager(),
  theme: {} as DefaultTheme,
})

const filterProps = (Wrapped: any, props: Record<string, any>) => {
  if (typeof window === 'undefined' || typeof Wrapped !== 'string') return props

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
  templateArr: TemplateStringsArray,
  args: StyledArgs<Props>[],
  props: Props
) =>
  templateArr
    .map((str, i) => {
      if (i === 0) return str

      let arg = args[i - 1]

      while (typeof arg === 'function' || (arg as any)?.componentClassName) {
        arg = (arg as any).componentClassName
          ? `.${(arg as any).componentClassName}`
          : (arg as any)(props)
      }

      return `${arg || arg === 0 ? arg : ''}${str}`
    })
    .join('')

const styled: StyledFactory = ((Wrapped: any) => {
  const newStyled = (templateArr: any, ...args: any) => {
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
          templateArr,
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
  templateArr: TemplateStringsArray,
  ...args: StyledArgs<Props & StyledProps>[]
) => (props: Props & StyledProps) => resolveTemplate(templateArr, args, props)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultTheme {}

export const ThemeProvider: FC<{
  root?: Pick<Element, 'appendChild'>
  theme: DefaultTheme
}> = ({ children, root, theme }) => {
  const getClassName = useMemo(() => createStyleManager(root), [root])
  const value = useMemo(() => ({ getClassName, theme }), [getClassName, theme])

  return (
    <styleManagerContext.Provider value={value}>
      {children}
    </styleManagerContext.Provider>
  )
}

export const useTheme = () => useContext(styleManagerContext).theme
