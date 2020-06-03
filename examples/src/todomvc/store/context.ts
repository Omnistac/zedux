import { Store } from '@zedux'
import { createContext } from 'react'

// Reducers are lower modules than contexts, so importing directly here is fine
// But selectors are higher! So importing from './todos' wouldn't work, since
// that file exports selectors too
import { TodosState } from './todos/reducers'

export interface RootState {
  todos: TodosState
  todoText: string
  visibilityFilter: string
}

export const RootContext = createContext<Store<RootState>>(null)
