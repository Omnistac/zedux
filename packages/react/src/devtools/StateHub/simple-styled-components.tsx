import React, {
  ComponentType,
  createContext,
  FC,
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

type IntrinsicProps<C extends Styleable> = C extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[C]
  : Record<string, never>

type Styleable = keyof JSX.IntrinsicElements | ComponentType<StyledProps>

type Styled<C extends Styleable> = <Props extends Record<string, any>>(
  templateArr: TemplateStringsArray,
  ...args: StyledArgs<Props>[]
) => FC<Props & IntrinsicProps<C>>

type StyledArgs<Props extends Record<string, any>> =
  | ((props: Props) => StyledArgs<Props>)
  | string
  | false
  | null
  | undefined
  | number

type StyledProps = PropsWithChildren<{ className: string }>

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

  constructor(private str: string) {
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
      return (this.currentGroupSelectors[0] += this.readString(next))
    }
    if (next === ',') return this.currentGroupSelectors.push('')
    if (next !== '{') return (this.currentGroupSelectors[0] += next)

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
      this.currentGroupSelectors = ['']
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
          .map(({ groupStack = [], props, selectors = [] }) => {
            const propsStr = props
              .map(([key, val]) => `${key}:${val}`)
              .join(';')

            const fullyQualifiedSelectors = groupStack.reduce(
              (qualifiedSelectors, groupIndex) => {
                const moreQualifiedSelectors: string[] = []
                const groupSelectors = groups[groupIndex].selectors || []
                const allSelectors = [...groupSelectors, ...selectors]

                allSelectors.forEach(selector => {
                  qualifiedSelectors.forEach(parentSelector => {
                    moreQualifiedSelectors.push(`${parentSelector}${selector}`)
                  })
                })

                return moreQualifiedSelectors
              },
              [`.${className}`]
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

      if (oldCache && oldCache !== cache) {
        if (cache) cache.refCount++
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

      const { groups } = new Parser(rawStr)

      cache = {
        className: generateClassName(),
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

const stylesContext = createContext(createStyleManager())

const resolveTemplate = <Props extends Record<string, any>>(
  templateArr: TemplateStringsArray,
  args: StyledArgs<Props>[],
  props: Props
) =>
  templateArr
    .map((str, i) => {
      if (i === 0) return str

      let arg = args[i - 1]

      while (typeof arg === 'function') {
        arg = arg(props)
      }

      return `${arg || arg === 0 ? arg : ''}${str}`
    })
    .join('')

export const css = <Props extends Record<string, any>>(
  templateArr: TemplateStringsArray,
  ...args: StyledArgs<Props>[]
) => (props: Props) => resolveTemplate(templateArr, args, props)

const styled: StyledFactory = (<C extends Styleable>(Wrapped: C) => {
  if (typeof Wrapped === 'string' && Wrapped in styled) {
    return styled[(Wrapped as unknown) as keyof typeof styled]
  }

  const newStyled = (templateArr: any, ...args: any) => {
    const Component: any = (props: any) => {
      const { getClassName } = useContext(stylesContext)
      const prevRawStr = useRef<string>()

      const className = useMemo(() => {
        const [newClassName, rawStr] = getClassName(
          templateArr,
          args,
          props,
          prevRawStr.current
        )
        prevRawStr.current = rawStr

        return newClassName
      }, [...Object.values(props)])

      return (<Wrapped {...props} className={className} />) as any
    }

    Component.displayName = `styled(${
      typeof Wrapped === 'string'
        ? Wrapped
        : (Wrapped as any).displayName || (Wrapped as any).name
    })`

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

export default styled
