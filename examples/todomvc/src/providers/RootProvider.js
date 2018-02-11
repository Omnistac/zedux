import React from 'react'
import { Provider, withStores } from 'react-zedux'

import api from './root/api'


const RootProvider = ({ children }) => (
  <Provider id={RootProvider} store={api}>
    {children}
  </Provider>
)


export default RootProvider


export const withRoot = withStores({
  rootStore: RootProvider
})
