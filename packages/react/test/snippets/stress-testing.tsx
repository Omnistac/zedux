import * as z from '@zedux/react'

let evaluations = 0
const ecosystem = z.createEcosystem()
const circularAtom = z.ion('circular', ({ get }, i: number): number => {
  evaluations++
  if (i >= 200) return i

  let result = 0
  for (let j = 0; j < 100; j++) {
    result += get(circularAtom, [(i + 1) * 1000 + j])
  }

  return result + get(circularAtom, [i + 1])
})

const start1 = performance.now()
const instance1 = ecosystem.getInstance(circularAtom, [0])
const end1 = performance.now()
console.log('creation time:', end1 - start1)

const instance2 = ecosystem.getInstance(circularAtom, [200])

const start2 = performance.now()
for (let i = 0; i < 50; i++) {
  const instance = ecosystem.getNode(circularAtom, [(i + 1) * 1000 + 99])
  instance.set(state => state + 1)
}
const end2 = performance.now()

console.log('update time:', end2 - start2, 'evaluations:', evaluations)
