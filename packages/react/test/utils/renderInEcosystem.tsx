import { render } from '@testing-library/react'
import { Ecosystem, EcosystemProvider } from '@zedux/react'
import React, { JSX, StrictMode } from 'react'
import { ecosystem as defaultEcosystem } from './ecosystem'

export const renderInEcosystem = (
  children: JSX.Element,
  {
    ecosystem = defaultEcosystem,
    useStrictMode,
  }: {
    ecosystem?: Ecosystem
    useStrictMode?: boolean
  } = {}
) => {
  const provider = (
    <EcosystemProvider ecosystem={ecosystem}>{children}</EcosystemProvider>
  )

  return render(useStrictMode ? <StrictMode>{provider}</StrictMode> : provider)
}
