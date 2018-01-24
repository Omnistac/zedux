import React from 'react'

import Footer from './components/Footer'
import Header from './components/Header'
import Main from './components/Main'
import RootProvider from './providers/RootProvider'


export default function App() {
  return (
    <RootProvider>
      <Header />
      <Main />
      <Footer />
    </RootProvider>
  )
}
