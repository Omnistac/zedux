import React from 'react'
import EnhancedSearch from 'enhancedocs-search'

import 'enhancedocs-search/dist/style.css'

export default function SearchBarWrapper(props) {
  return (
    <EnhancedSearch
      config={{
        enhancedSearch: {
          projectId: '6435f1864f5eaca6c03bf1d4',
          accessToken: 'pk_aef46253e9ecf7fe32442ff1e7c51cdb9bbd9663f5170931',
        },
      }}
      {...props}
    />
  )
}
