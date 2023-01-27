import React, { createContext, PropsWithChildren, useContext } from 'react'
import styled from '@site/src/ssc'

const ItemDesc = styled.div`
  padding: 1rem;
`

const ItemName = styled.div`
  padding: 1rem;
`

const Wrapper = styled.div`
  border-radius: 5px;
  box-shadow: 4px 4px 8px 1px #0004;
  display: grid;
  grid-template-columns: auto minmax(0, 4fr);
  margin: 0 -0.8rem;
`

export const Legend = ({ children }: PropsWithChildren) => {
  return <Wrapper>{children}</Wrapper>
}

const prefixContext = createContext('')

export const Item = ({
  children,
  name,
}: PropsWithChildren<{ name: string }>) => {
  const prefix = useContext(prefixContext)
  const id = prefix + name.toLowerCase().replace(/[^a-z]/g, '')

  return (
    <>
      <ItemName
        className="anchor anchorWithStickyNavbar_node_modules-@docusaurus-theme-classic-lib-theme-Heading-styles-module"
        id={id}
      >
        {name === 'Returns' ? name : <code>{name}</code>}
        <a className="hash-link" href={`#${id}`} />
      </ItemName>
      <ItemDesc>
        <prefixContext.Provider value={`${id}__`}>
          {children}
        </prefixContext.Provider>
      </ItemDesc>
    </>
  )
}
