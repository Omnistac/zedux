import 'react-hot-loader/patch'
import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import App from './App'


ReactDOM.render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.getElementById('root')
)
