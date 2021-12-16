import React from 'react'
import styled from '@zedux/react/ssc'
import { Controls } from './Controls'
import { Scene } from './Scene'

const Grid = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  padding: 0.5em;
`

export const Graph = () => {
  return (
    <Grid>
      <Controls />
      <Scene />
    </Grid>
  )
}
