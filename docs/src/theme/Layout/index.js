import React, { useEffect, useMemo } from 'react'
import { useLocation } from '@docusaurus/router'
import Layout from '@theme-original/Layout'
import { ThemeProvider } from '@site/src/ssc'

const OutputStyleTag = ({ tag }) => {
  if (typeof window !== 'undefined') return null // this is only for SSR

  return <style data-ssc="true">{tag.innerHTML}</style>
}

export default function LayoutWrapper(props) {
  const { pathname } = useLocation()
  const mockStyleTag = useMemo(() => ({ dataset: {} }), [])

  useEffect(() => {
    setTimeout(() => {
      if (location.hash && document.scrollingElement.scrollTop === 0) {
        const el = document.getElementById(location.hash.slice(1))
        if (!el) return

        el.scrollIntoView()
      }
    }, 500)
  }, [])

  return (
    <>
      <ThemeProvider
        id={pathname.replace(/[^a-zA-Z]/g, '_')}
        styleTag={typeof document === 'undefined' ? mockStyleTag : undefined}
      >
        <Layout {...props} />
      </ThemeProvider>

      <OutputStyleTag tag={mockStyleTag} />
    </>
  )
}
