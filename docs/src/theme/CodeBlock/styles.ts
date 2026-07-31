import { usePrismTheme } from '@docusaurus/theme-common'
import { Editable } from 'slate-react'
import styled, { css } from '@site/src/ssc'

export const EditorWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  font-family: var(--ifm-font-family-monospace);
  font-size: var(--ifm-code-font-size);
  letter-spacing: -0.3px;
  max-height: 500px;
  overflow-y: auto;
`

export const Gutter = styled.div`
  border-bottom-left-radius: var(--ifm-pre-border-radius);
  display: flex;
  flex-flow: column nowrap;
  height: fit-content;
  min-height: 100%;
  min-width: 1.7rem;
  padding: 0.5rem 5px 1rem;
  text-align: right;

  > span {
    color: #fffb;
    transform: scale(0.8);
    white-space: nowrap;
  }
`

export const Header = styled.div`
  align-items: center;
  background: var(--zedux-code-background);
  border-bottom: 1px solid var(--zedux-code-border);
  border-radius: var(--ifm-pre-border-radius) var(--ifm-pre-border-radius) 0 0;
  color: #fff;
  display: flex;
  flex-flow: row nowrap;
  gap: 1rem;
  grid-column: span 2;
  padding: 0.5rem;

  > img {
    filter: brightness(0) invert(1);
    font-size: 0;
    height: 1rem;
  }
`

export const HeaderActions = styled.span`
  display: flex;
  flex-flow: row nowrap;
  gap: 1rem;
`

export const HeaderText = styled.span`
  flex: 1;
`

export const ResetButton = styled.button`
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 3px;
  color: inherit;
  cursor: pointer;
  font-size: 0.8em;
  padding: 2px 1rem;

  &:hover {
    opacity: 0.75;
  }
`

export const Result = styled.div`
  background: #fff;
  border-bottom-right-radius: var(--ifm-pre-border-radius);
  border-left: 1px solid var(--zedux-code-border);
  color: #1c1e21;
  color-scheme: light;
  max-height: 500px;
  overflow: auto;
  padding: 0.5rem;
  position: relative;
`

export const StyledEditable = styled(Editable)<{
  $sscProps: ReturnType<typeof usePrismTheme>
}>`
  background: var(--zedux-code-background);
  flex: 1;
  height: fit-content;
  min-height: 100%;
  overflow-x: auto;
  padding: 0.5rem 0.5rem 1rem;
  white-space: pre !important;

  > div {
    min-width: fit-content;
    padding-right: 0.5rem;
  }

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

export const Wrapper = styled.section`
  background: var(--zedux-code-background);
  border: 1px solid var(--zedux-code-border);
  border-radius: var(--ifm-pre-border-radius);
  box-shadow: none;
  display: grid;
  grid-template-columns: minmax(180px, 13fr) minmax(140px, 6fr);
  grid-template-rows: auto auto;
  line-height: 1.45;
  margin: 0 0 2em;

  @container (min-width: 400px) {
    margin-left: -1rem;
    margin-right: -1rem;
  }

  @container (min-width: 760px) {
    margin-left: -3rem;
    margin-right: -3rem;
  }

  @media (max-width: 996px) {
    margin-left: 0;
    margin-right: 0;
  }
`
