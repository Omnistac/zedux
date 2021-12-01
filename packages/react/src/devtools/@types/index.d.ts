import '@zedux/react/ssc'
import { RectType } from '../StateHub/types'

declare module '@zedux/react/ssc' {
  export interface DefaultTheme {
    colors: {
      alphas: {
        primary: string[]
        secondary: string[]
        white: string[]
      }
      background: string
      bgs: string[]
      fgs: string[]
      primary: string
      secondary: string
      white: string
    }
    height: RectType
    width: RectType
  }
}
