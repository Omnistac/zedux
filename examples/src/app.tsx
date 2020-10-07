import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { Counters } from './counters'
import { HigherOrderStore } from './higher-order-store'
import { Root } from './root'
import { Rpg } from './rpg'
import { TimeTravel } from './time-travel'
import { Todomvc } from './todomvc'

import 'todomvc-app-css/index.css'

const GlobalStyle = createGlobalStyle`
  html {
    font-size: 1px;
  }

  body {
    color: #555;
    font-size: 18px;
    margin: 0 auto;
  }

  #root {
    display: flex;
    flex-flow: column nowrap;
    min-height: 100vh;
  }
`

const theme = {
  main: '#ff4b4b',
  mainDark: '#ff1818',
}

console.log('A snippet to get you started:')
console.log(`store1 = Zedux.createStore()
store2 = Zedux.createStore()

store1.use({ foo: store2.hydrate('bar') })
store1.getState()`)

export const App = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <BrowserRouter>
      <Switch>
        <Route path="/counter">
          <Counters />
        </Route>
        <Route path="/destroy-the-castle">
          <DestroyTheCastle />
        </Route>
        <Route path="/higher-order-store">
          <HigherOrderStore />
        </Route>
        <Route path="/rpg">
          <Rpg />
        </Route>
        <Route path="/time-travel">
          <TimeTravel />
        </Route>
        <Route path="/todomvc">
          <Todomvc />
        </Route>
        <Route path="/">
          <Root />
        </Route>
      </Switch>
    </BrowserRouter>
  </ThemeProvider>
)
