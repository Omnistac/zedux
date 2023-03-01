import React, { useEffect, useState } from 'react'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import Layout from '@theme-original/Layout'
import { ThemeProvider } from '@site/src/ssc'

const head =
  typeof document === 'undefined'
    ? { querySelector: () => null }
    : document.head

export default function LayoutWrapper(props) {
  const [isHidden, setIsHidden] = useState(!head.querySelector('[data-ssc]'))
  const logoUrl = useBaseUrl('/img/logo.png')

  useEffect(() => {
    setTimeout(() => setIsHidden(false), 500)
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
        {isHidden && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '1em',
              height: '100%',
              justifyContent: 'center',
              left: 0,
              position: 'fixed',
              top: 0,
              width: '100%',
            }}
          >
            <img src={logoUrl} style={{ height: '150px', width: '150px' }} />
            <div style={{ fontSize: '2em' }}>Loading Some Amazing Docs...</div>
          </div>
        )}
      </ThemeProvider>
    </>
  )
}
