import 'react-hot-loader/patch'
import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import App from './App'

render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.getElementById('root')
)
