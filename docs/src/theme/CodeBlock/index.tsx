/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { usePrismTheme } from '@docusaurus/theme-common'
import styled, { css } from '@site/src/ssc'
import CodeBlock from '@theme-init/CodeBlock'
import Prism from 'prismjs'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-bash'
import React from 'react'
import { Sandbox } from './Sandbox'

const Code = styled.code<{ $sscProps: ReturnType<typeof usePrismTheme> }>`
  display: block;

  .token {
    color: #d7dfec;

    ${({ $sscProps }) =>
      $sscProps.styles
        .map(({ style, types }) =>
          types
            .map(
              type =>
                `&.${type} { ${css(
                  style as any /* Prism font-weight type is wrong */
                )} }`
            )
            .join('\n')
        )
        .join('\n')}

    &.comment {
      font-style: italic;
    }

    &.keyword {
      color: #e08a57;
    }
  }
`

const renderTokens = (tokens: (string | Prism.Token)[]) =>
  tokens.map((token, i) => (
    <span
      className={`token ${typeof token === 'string' ? '' : token.type}`}
      key={i}
    >
      {typeof token === 'string'
        ? token
        : typeof token.content === 'string'
        ? token.content
        : renderTokens(
            Array.isArray(token.content) ? token.content : [token.content]
          )}
    </span>
  ))

const withLiveEditor = (Component: typeof CodeBlock) => {
  function WrappedComponent(props: any) {
    const theme = usePrismTheme()

    if (props.live) {
      return <Sandbox {...props} />
    }

    return <Component {...props} />

    const tokens = Prism.tokenize(
      props.children,
      Prism.languages[props.language || props.className?.split('-')[1] || 'tsx']
    )

    return (
      <>
        <div
          className="codeBlockContainer_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-Container-styles-module theme-code-block"
          style={
            {
              '--prism-color': '#bfc7d5',
              '--prism-background-color': '#292d3e',
            } as any
          }
        >
          <div className="codeBlockContent_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-Content-styles-module">
            <pre
              tabIndex={0}
              className="prism-code codeBlock_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-Content-styles-module thin-scrollbar"
            >
              <Code
                className={`${props.className} codeBlockLines_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-Content-styles-module`}
                $sscProps={theme}
              >
                {renderTokens(tokens)}
              </Code>
            </pre>
            {/* <div className="buttonGroup_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-Content-styles-module">
              <button
                type="button"
                className="clean-btn"
                aria-label="Toggle word wrap"
                title="Toggle word wrap"
              >
                <svg
                  className="wordWrapButtonIcon_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-WordWrapButton-styles-module"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M4 19h6v-2H4v2zM20 5H4v2h16V5zm-3 6H4v2h13.25c1.1 0 2 .9 2 2s-.9 2-2 2H15v-2l-3 3l3 3v-2h2c2.21 0 4-1.79 4-4s-1.79-4-4-4z"
                  ></path>
                </svg>
              </button>
              <button
                type="button"
                aria-label="Copy code to clipboard"
                title="Copy"
                className="clean-btn"
              >
                <span
                  className="copyButtonIcons_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-CopyButton-styles-module"
                  aria-hidden="true"
                >
                  <svg
                    className="copyButtonIcon_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-CopyButton-styles-module"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"></path>
                  </svg>
                  <svg
                    className="copyButtonSuccessIcon_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-CopyButton-styles-module"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"></path>
                  </svg>
                </span>
              </button>
            </div> */}
          </div>
        </div>
      </>
    )
  }

  return WrappedComponent
}

export default withLiveEditor(CodeBlock)
