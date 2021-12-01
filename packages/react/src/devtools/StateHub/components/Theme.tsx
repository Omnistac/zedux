import { useAtomSelector, useAtomValue } from '@zedux/react'
import { DefaultTheme, ThemeProvider } from '@zedux/react/ssc'
import React, { FC } from 'react'
import { rect } from '../atoms/rect'
import { stateHub } from '../atoms/stateHub'
import { alphas, hexToAlpha } from '../styles'

const bgs = ['#0c1f30', '#0a142e', '#240e15', '#261709', '#0c2823', '#222222']
const fgs = ['#ffd6b9', '#ffb9d6', '#d6ffb9', '#d6b9ff', '#b9ffd6', '#b9d6ff']
let seed = Math.floor(Math.random() * fgs.length)
const randomColor = () => fgs[seed++ % fgs.length]
const primary = randomColor()
const secondary = randomColor()
const white = '#f7f7f7'

export const Theme: FC = ({ children }) => {
  const colors = useAtomSelector(({ get }) => get(stateHub).colors)
  const { height, width } = useAtomValue(rect)

  const theme: DefaultTheme = {
    colors: {
      alphas: {
        primary: alphas.map(alpha =>
          hexToAlpha(colors.primary || primary, alpha)
        ),
        secondary: alphas.map(alpha =>
          hexToAlpha(colors.secondary || secondary, alpha)
        ),
        white: alphas.map(alpha => hexToAlpha(white, alpha)),
      },
      background: bgs[0],
      bgs,
      fgs,
      primary,
      secondary,
      white,
      ...colors,
    },
    height,
    width,
  }

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
