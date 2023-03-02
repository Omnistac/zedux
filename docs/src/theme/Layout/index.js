import React, { useEffect } from 'react'
import { useLocation } from '@docusaurus/router'
import Layout from '@theme-original/Layout'
import { ThemeProvider } from '@site/src/ssc'

export default function LayoutWrapper(props) {
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
      <ThemeProvider id={useLocation().pathname.replace(/[^a-zA-Z]/g, '_')}>
        <Layout {...props} />
      </ThemeProvider>
    </>
  )
}
