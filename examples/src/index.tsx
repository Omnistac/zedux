import * as Zedux from '@zedux'
import React from 'react'
import { render } from 'react-dom'
import { App } from './app'

render(<App />, document.getElementById('root'))

// Make Zedux available in the console
;(window as any).Zedux = Zedux
