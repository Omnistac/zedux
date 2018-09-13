import React from 'react'

export default {
  Document: ({ Body, Head, Html, children }) => (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Zedux Todomvc Example</title>
      </Head>
      <Body>{children}</Body>
    </Html>
  )
}
