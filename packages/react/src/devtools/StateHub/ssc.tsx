import React, { ComponentType, FC, ReactNode } from 'react'

export const styled = (
  wrappedComponent: ComponentType<{ className: string }>
) => {}

styled.div = <Props extends { children?: ReactNode; [key: string]: any }>(
  templateArr: TemplateStringsArray,
  ...args: ((props: Props) => string)[]
) => {
  const Div: FC<Props> = props => {
    const styles = templateArr.map((str, i) => {
      if (i === 0) return str

      const arg =
        typeof args[i - 1] === 'string' ? args[i - 1] : args[i - 1](props)

      return `${arg}${str}`
    })

    return <div>{props.children}</div>
  }

  return Div
}

const MyDiv = styled.div`
  display: ${({ display }: { display: string }) => display};
`
