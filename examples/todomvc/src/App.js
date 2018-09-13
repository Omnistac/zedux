import React from 'react'
import { hot } from 'react-hot-loader';

import 'todomvc-app-css/index.css'

import Footer from './components/Footer'
import Header from './components/Header'
import Main from './components/Main'
import RootContext from './contexts/RootContext'

import './app.css'

const App = () => (
  <div className="todoapp">
    <RootContext.Provider>
      <Header />
      <Main />
      <Footer />
    </RootContext.Provider>
  </div>
)

export default hot(module)(App)