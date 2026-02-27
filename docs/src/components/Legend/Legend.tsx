import React, { createContext, PropsWithChildren, useContext } from 'react'
import styled from '@site/src/ssc'

const ItemDesc = styled.div`
  container-type: inline-size;
  padding: 1rem;
`

const ItemName = styled.div`
  padding: 1rem;
  scroll-margin-top: calc(var(--ifm-navbar-height) + 0.5rem);

  @container (max-width: 600px) {
    &:not(:first-of-type) {
      border-top: 1px solid #ddd;
    }
  }
`

const Wrapper = styled.div`
  border-radius: 5px;
  box-shadow: 4px 4px 8px 1px #0004;
  display: grid;
  grid-template-columns: auto minmax(0, 4fr);
  margin: 0 -0.8rem var(--ifm-paragraph-margin-bottom);

  @container (max-width: 600px) {
    grid-template-columns: auto;
  }
`

export const Legend = ({ children }: PropsWithChildren) => {
  return <Wrapper>{children}</Wrapper>
}

const prefixContext = createContext('')

export const Item = ({
  children,
  name,
  suffix = '',
}: PropsWithChildren<{ name: string; suffix?: string }>) => {
  const prefix = useContext(prefixContext)
  const id =
    prefix +
    name.toLowerCase().replace(/[^a-z]/g, '') +
    (suffix ? `-${suffix}` : '')

  return (
    <>
      <ItemName
        className="anchor anchorWithStickyNavbar_node_modules-@docusaurus-theme-classic-lib-theme-Heading-styles-module"
        id={id}
      >
        {name === 'Returns' ? name : <code>{name}</code>}
        {suffix && <span> {suffix}</span>}
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
