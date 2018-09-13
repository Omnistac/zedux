import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'

export default App

if (typeof document !== 'undefined') {
  const render = module.hot ? ReactDOM.render : ReactDOM.hydrate || ReactDOM.render

  render(<App />, document.getElementById('root'))
}
