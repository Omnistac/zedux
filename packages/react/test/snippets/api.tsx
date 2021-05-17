import { atom } from '@zedux/react'
import { api } from '@zedux/react/factories/api'
import React from 'react'

const testAtom = atom('test', () => {
  return api(2).setExports({
    doStuff: (yes: boolean) => (yes ? 3 : 4),
  })
})

function Greeting() {
  const test = testAtom.useValue()
  const { doStuff } = testAtom.useExports()

  const stuffResult = doStuff(true)

  return (
    <div>
      {test} {stuffResult}
    </div>
  )
}
