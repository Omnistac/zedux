import React, { Fragment } from 'react'

import Gold from './components/Gold'
import Market from './components/Market'
import StoreDump from './components/StoreDump'
import Weapons from './components/Weapons'


export default function App() {
  return (
    <Fragment>
      <Gold />
      <Weapons />
      <Market />
      <StoreDump />
    </Fragment>
  )
}
