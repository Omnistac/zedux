import { RecursivePartial } from '@zedux/core'
import { useEcosystem } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { ComponentProps, FC, PropsWithChildren } from 'react'
import { stateHub, StateHubState } from '../atoms/stateHub'
import { hexToAlpha, IconButton } from '../styles'

const Link = styled.button`
  appearance: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.secondary};
  cursor: pointer;
  font-size: inherit;
  padding: 0;

  &:hover {
    color: ${({ theme }) => hexToAlpha(theme.colors.secondary, '0.8')};
    text-decoration: underline;
  }
`

export const SettingsButton: FC<
  {
    to:
      | RecursivePartial<StateHubState>
      | ((state: StateHubState) => RecursivePartial<StateHubState>)
  } & ComponentProps<typeof IconButton>
> = ({ children, to, ...props }) => {
  // we're avoiding creating a static dependency on stateHub here 'cause that
  // can add an Edge Created log entry, which can cause confusing motion on the
  // Log screen. It's fine; we know that the instance will exist here 'cause
  // parent components create dependencies on it.
  const ecosystem = useEcosystem()

  return (
    <IconButton
      {...props}
      onClick={() => ecosystem.getInstance(stateHub).store.setStateDeep(to)}
    >
      {children}
    </IconButton>
  )
}

export const SettingsLink = ({ children, to }: PropsWithChildren<{
  to:
    | RecursivePartial<StateHubState>
    | ((state: StateHubState) => RecursivePartial<StateHubState>)
}>) => {
  // we're avoiding creating a static dependency on stateHub here 'cause that
  // can add an Edge Created log entry, which can cause confusing motion on the
  // Log screen. It's fine; we know that the instance will exist here 'cause
  // parent components create dependencies on it.
  const ecosystem = useEcosystem()

  return (
    <Link
      onClick={() => ecosystem.getInstance(stateHub).store.setStateDeep(to)}
    >
      {children}
    </Link>
  )
}
