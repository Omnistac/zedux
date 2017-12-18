import { createStore } from 'zedux'

import entities from './entities/store'
import gold from './gold'
import weapons from './weapons'


export default createStore()
  .use({
    entities,
    gold,
    weapons
  })
