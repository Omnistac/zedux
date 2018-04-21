import React from 'react'

import Counter from './components/Counter'
import RootContext from './contexts/RootContext'


export default function App() {
  return (
    <RootContext.Provider>
      <Counter />
      <Counter />
      <Counter />
    </RootContext.Provider>
  )
}
