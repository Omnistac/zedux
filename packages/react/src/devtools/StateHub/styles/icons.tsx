import styled, { css } from '@zedux/react/ssc'
import {
  AtomIcon,
  AtomInstanceIcon,
  CycleIcon,
  FlagIcon,
  KeyIcon,
  LogIcon,
  WorldIcon,
  XIcon,
} from './icons-raw'

export const IconButton = styled.button`
  align-items: center;
  appearance: none;
  background: none;
  border: none;
  cursor: pointer;
  display: grid;
  justify-content: center;
  padding: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.alphas.white[1]};
  }
`

export const iconStyles = css`
  color: ${({ theme }) => theme.colors.primary};
  height: 100%;
  width: 100%;
`

export const IconAtom = styled(AtomIcon)`
  ${iconStyles}
`

export const IconAtomInstance = styled(AtomInstanceIcon)`
  ${iconStyles}
`

export const IconCycle = styled(CycleIcon)`
  ${iconStyles}

  & > path {
    stroke: ${({ theme }) => theme.colors.primary};
  }
`

export const IconFlag = styled(FlagIcon)`
  ${iconStyles}
`

export const IconKey = styled(KeyIcon)`
  ${iconStyles}
`

export const IconLog = styled(LogIcon)`
  color: ${({ theme }) => theme.colors.primary};
  height: 1.4em;
  width: 1.4em;
`

export const IconWorld = styled(WorldIcon)`
  ${iconStyles}
`

export const IconX = styled(XIcon)`
  ${iconStyles}
`
