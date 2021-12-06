import { useAtomInstance, useAtomValue } from '@zedux/react'
import React from 'react'
import { IoMdClose } from 'react-icons/io'
import { Toast, toasts as toastsAtom } from '../atoms/toasts'
import styled from '@zedux/react/ssc'

const toastBgs = {
  error: '#ffc7c7',
  errorDark: '#ffa0a0',
  errorLight: '#ffd0d0',
  info: '#c7c7ff',
  infoDark: '#a0a0ff',
  infoLight: '#d0d0ff',
  warning: '#ffffc7',
  warningDark: '#ffffa0',
  warningLight: '#ffffd0',
}

const CloseIcon = styled(IoMdClose)`
  font-size: 1.3em;
  transform: rotate(0);
  transition: transform 0.1s;
`

const Description = styled.span`
  grid-column: span 2;
`

const List = styled('ul')`
  list-style: none;
  margin: 0;
  max-width: 35em;
  padding: 0;
  pointer-events: none;
  position: absolute;
  top: 1em;
  right: 1em;
  width: 50%;
  z-index: 2;
`

const Title = styled('h4')`
  font-size: 1.1em;
  font-weight: normal;
  margin: 0;
`

const ToastWrapper = styled('li')<{ type: Toast['type'] }>`
  background: ${({ type }) => toastBgs[type]};
  box-shadow: 5px 5px
    ${({ type }) => toastBgs[`${type}Dark` as keyof typeof toastBgs]};
  border-radius: 0.5em;
  color: #555;
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 0.5em;
  padding: 0.5em;
  pointer-events: all;
  user-select: none;

  &:hover {
    background: ${({ type }) =>
      toastBgs[`${type}Light` as keyof typeof toastBgs]};

    & ${CloseIcon} {
      transform: rotate(90deg);
    }
  }
`

export const Toasts = () => {
  const toasts = useAtomValue(toastsAtom)
  const { hideToast } = useAtomInstance(toastsAtom).exports

  if (!toasts.length) return null

  const [toast] = toasts

  return (
    <List>
      <ToastWrapper onClick={hideToast} type={toast.type}>
        {toast.title && <Title>{toast.title}</Title>}
        <CloseIcon />
        <Description>{toast.description}</Description>
      </ToastWrapper>
    </List>
  )
}
