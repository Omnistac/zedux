import { usePrismTheme } from '@docusaurus/theme-common'
import { Editable } from 'slate-react'
import styled, { css } from 'styled-components'

export const EditorWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  font-family: 'Source Code Pro', monospace;
  font-size: var(--ifm-code-font-size);
  letter-spacing: -0.2px;
  max-height: 500px;
  overflow-y: auto;
`

export const Gutter = styled.div`
  background: #fff2;
  border-bottom-left-radius: 12px;
  display: flex;
  flex-flow: column nowrap;
  height: fit-content;
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
  background: #ffa359;
  border-radius: 12px 12px 0 0;
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
  background: #fff;
  border: none;
  border-radius: 3px;
  color: #ff4545;
  cursor: pointer;
  font-size: 0.8em;
  padding: 2px 1rem;

  &:hover {
    background: #fffb;
  }
`

export const Result = styled.div`
  background: #fff;
  border-bottom-right-radius: 12px;
  box-shadow: inset 4px 4px 6px #888;
  max-height: 500px;
  overflow: auto;
  padding: 0.5rem;
  position: relative;
`

export const StyledEditable = styled(Editable)<{
  $theme: ReturnType<typeof usePrismTheme>
}>`
  height: fit-content;
  overflow-x: auto;
  padding: 0.5rem 0.5rem 1rem;
  white-space: pre !important;

  > div {
    min-width: fit-content;
    padding-right: 0.5rem;
  }

  .token {
    color: #d7dfec;

    ${({ $theme }) =>
      $theme.styles
        .map(({ style, types }) =>
          types
            .map(
              type =>
                `&.${type} { ${css(
                  style as any /* this basically works for some reason */
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
  background: #2b313a;
  border-radius: 12px;
  box-shadow: 10px 10px 7px rgba(0, 0, 0, 0.4);
  display: grid;
  grid-template-columns: minmax(180px, 9fr) minmax(140px, 5fr);
  grid-template-rows: auto auto;
  line-height: 1.45;
  margin: 0 -0.6rem 2em;

  @media (min-width: 1600px) {
    margin-left: -1.8rem;
    margin-right: -1.8rem;
  }
`
