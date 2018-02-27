import React from 'react'

import Footer from './components/Footer'
import Header from './components/Header'
import Main from './components/Main'
import RootContext from './contexts/RootContext'


export default function App() {
  return (
    <RootContext.Provider>
      <Header />
      <Main />
      <Footer />
    </RootContext.Provider>
  )
}
