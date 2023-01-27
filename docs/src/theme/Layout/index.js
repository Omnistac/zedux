import React, { useLayoutEffect, useState } from 'react'
import { useLocation } from '@docusaurus/router'
import Layout from '@theme-original/Layout'
import { ThemeProvider } from '@site/src/ssc'

const head =
  typeof document === 'undefined'
    ? { querySelector: () => null }
    : document.head

export default function LayoutWrapper(props) {
  const [isHidden, setIsHidden] = useState(head.querySelector('[data-ssc]'))

  useLayoutEffect(() => {
    if (head.querySelector('[data-ssc]')) {
      return setIsHidden(false)
    }

    const observer = new MutationObserver(() => {
      if (head.querySelector('[data-ssc]')) {
        setIsHidden(false)
      }
    })

    observer.observe(head, { childList: true })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <ThemeProvider id={useLocation().pathname.replace(/[^a-zA-Z]/g, '_')}>
        <div
          className={isHidden ? 'ssc-hide' : ''}
          style={{ display: 'contents' }}
        >
          <Layout {...props} />
        </div>
      </ThemeProvider>
    </>
  )
}
