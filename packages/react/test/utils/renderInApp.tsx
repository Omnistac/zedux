import { render } from '@testing-library/react'
import { AppProvider } from '@zedux/react'
import React from 'react'

export const renderInApp = (children: JSX.Element) =>
  render(<AppProvider>{children}</AppProvider>)
