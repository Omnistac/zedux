import { useAtomSelector, useAtomValue } from '@zedux/react'
import { DefaultTheme, ThemeProvider } from '@zedux/react/ssc'
import React, { PropsWithChildren, useMemo } from 'react'
import { rect } from '../atoms/rect'
import { getColors } from '../atoms/stateHub'
import { alphas, bgs, fgs, hexToAlpha } from '../styles'

const white = '#f7f7f7'

export const Theme = ({ children }: PropsWithChildren<{}>) => {
  const colors = useAtomSelector(getColors)
  const { height, width } = useAtomValue(rect)

  const theme: DefaultTheme = useMemo(
    () => ({
      colors: {
        alphas: {
          primary: alphas.map(alpha => hexToAlpha(colors.primary, alpha)),
          secondary: alphas.map(alpha => hexToAlpha(colors.secondary, alpha)),
          white: alphas.map(alpha => hexToAlpha(white, alpha)),
        },
        bgs,
        fgs,
        white,
        ...colors,
      },
      fonts: {
        monospace:
          "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
      height,
      width,
    }),
    [colors, height, width]
  )

  return (
    <ThemeProvider
      root={
        document.querySelector('[data-zedux="StateHub"]')?.shadowRoot ||
        undefined
      }
      theme={theme}
    >
      {children}
    </ThemeProvider>
  )
}
