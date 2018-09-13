import React from 'react'
import { withRouteData } from 'react-static'
//

export default withRouteData(
  props =>
    console.log(props) || (
      <div>
        <h1>404 - Oh no's! We couldn't find that page :(</h1>
      </div>
    )
)
