import React from 'react'
import { useLocation } from '@docusaurus/router'
import Layout from '@theme-original/Layout'
import { ThemeProvider } from '@site/src/ssc'

export default function LayoutWrapper(props) {
  return (
    <>
      <ThemeProvider id={useLocation().pathname.replace(/[^a-zA-Z]/g, '_')}>
        <Layout {...props} />
      </ThemeProvider>
    </>
  )
}
