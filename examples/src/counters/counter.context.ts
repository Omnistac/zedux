import { createContext } from 'react'
import { Store } from '@zedux'

export const CounterContext = createContext<Store<number>>(null)
