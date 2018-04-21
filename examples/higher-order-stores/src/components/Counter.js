import React from 'react'

import Counter from '../../../counter/src/components/Counter'
import RootContext from '../contexts/RootContext'


export default RootContext.consume('parentStore')(Counter)
