import { createStore } from '@zedux'
import React, { useMemo } from 'react'
import { createGlobalStyle } from 'styled-components'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Main } from './components/Main'
import { RootContext, todos, todoText, visibilityFilter } from './store'

const GlobalStyle = createGlobalStyle`
  .filters a {
    cursor: pointer;
  }
`

export const Todomvc = () => {
  const store = useMemo(
    () => createStore({ todos, todoText, visibilityFilter }),
    []
  )

  return (
    <div className="todoapp">
      <GlobalStyle />
      <RootContext.Provider value={store}>
        <Header />
        <Main />
        <Footer />
      </RootContext.Provider>
    </div>
  )
}
