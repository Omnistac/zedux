import { configure } from 'eta'
import React, { useEffect, useMemo } from 'react'
import { useLocation } from '@docusaurus/router'
import Layout from '@theme-original/Layout'
import { ThemeProvider } from '@site/src/ssc'

// docusaurus straight up ignores style elements injected in the Head
// (react-helmet-async), so we can't get ssc to work legitimately server-side.
// Hack it.
global.styleTags = {}

configure({
  plugins: [
    {
      processFnString: result => {
        const newResult = result.replace(
          "tR+='</head>",
          `var __attr=it.metaAttributes.find(attr => attr.includes('property="og:url"'))
var __match=__attr.match(/property="og:url" content="https:\\/\\/omnistac.github.io(.*?)"/)[1]
if (__match && global.styleTags[__match]) tR+='<style data-ssc="true">'+global.styleTags[__match].current.innerHTML+'</style>'
tR+='</head>`
        )
        return newResult
      },
    },
  ],
})

export default function LayoutWrapper(props) {
  const _location = useLocation()

  useMemo(() => {
    global.styleTags[_location.pathname] = { current: { dataset: {} } }
  }, [])

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
        id={_location.pathname.replace(/[^a-zA-Z]/g, '_')}
        styleTag={
          typeof document === 'undefined'
            ? global.styleTags[_location.pathname].current
            : undefined
        }
      >
        <Layout {...props} />
      </ThemeProvider>
    </>
  )
}
