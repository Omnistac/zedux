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

type Styleable = keyof JSX.IntrinsicElements | ComponentType<StylerProps>

type Styled<C extends Styleable> = <
  Props extends Record<string, any> = StylerProps
>(
  templateArr: TemplateStringsArray,
  ...args: StyledArgs<Props & ComponentPropsWithRef<C> & StyledProps>[]
) => FC<Props & ComponentPropsWithRef<C>> & {
  componentClassName: string
}

type StyledArgs<Props extends Record<string, any>> =
  | ((props: Props) => StyledArgs<Props>)
  | { componentClassName: string }
  | string
  | false
  | null
  | undefined
  | number

type StyledProps = PropsWithChildren<{
  className?: string
  theme: DefaultTheme
}>

type StylerProps = PropsWithChildren<{
  className?: string
  theme?: DefaultTheme
}>

type StyledFactory = {
  <C extends Styleable>(Wrapped: C): Styled<C>
  aside: Styled<'aside'>
  button: Styled<'button'>
  div: Styled<'div'>
  header: Styled<'header'>
  input: Styled<'input'>
  main: Styled<'main'>
  section: Styled<'section'>
  span: Styled<'span'>
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

const createStyleManager = () => {
  const id = btoa(Math.random().toString()).slice(3, 9)
  let idCounter = 0
  const generateClassName = () => `s${id}${idCounter++}`
  const replaceStr = `REPLACEWITHCLASS${id}`

  const styleTag = document.createElement('style')
  styleTag.dataset.ssc = 'active'
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

    styleTag.innerHTML = styles
  }

  const styleManager = {
    getClassName: <Props extends Record<string, any>>(
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
    },
  }

  if (typeof window !== 'undefined') {
    document.head.appendChild(styleTag)
  }

  return styleManager
}

let globalIdCounter = 0
const specialProps = { children: 1, htmlFor: 1, key: 1, ref: 1, theme: 1 }
const stylesContext = createContext(createStyleManager())

const filterProps = (Wrapped: any, props: Record<string, any>) => {
  if (typeof window === 'undefined' || typeof Wrapped !== 'string') return props

  return Object.keys(props)
    .filter(prop => {
      if (specialProps[prop as keyof typeof specialProps]) return true

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
  if (typeof Wrapped === 'string' && Wrapped in styled) {
    return styled[Wrapped as keyof typeof styled]
  }

  const newStyled = (templateArr: any, ...args: any) => {
    const Component: any = forwardRef((props: any, ref: any) => {
      const { getClassName } = useContext(stylesContext)
      const prevRawStr = useRef<string>()
      const prevProps = useRef<any>(props)
      const theme = useContext(ThemeContext)

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

  if (typeof Wrapped === 'string') {
    styled[Wrapped as keyof typeof styled] = newStyled as any
  }

  return newStyled
}) as StyledFactory

styled.aside = styled('aside')
styled.button = styled('button')
styled.div = styled('div')
styled.header = styled('header')
styled.input = styled('input')
styled.main = styled('main')
styled.section = styled('section')
styled.span = styled('span')

const ThemeContext = createContext<DefaultTheme>({} as DefaultTheme)

export default styled

export const css = <Props extends Record<string, any>>(
  templateArr: TemplateStringsArray,
  ...args: StyledArgs<Props & StyledProps>[]
) => (props: Props & StyledProps) => resolveTemplate(templateArr, args, props)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultTheme {}

export const ThemeProvider: FC<{ theme: DefaultTheme }> = ({
  children,
  theme,
}) => <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>

export const useTheme = () => useContext(ThemeContext)
