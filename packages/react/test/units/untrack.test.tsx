import { atom } from '@zedux/atoms'
import { untrack } from '@zedux/atoms/utils/evaluationContext'
import { ecosystem } from '../utils/ecosystem'

describe('untrack', () => {
  test('prevents graph edges from being created in reactive contexts', () => {
    let isTracking = true
    const signal = ecosystem.signal(0)

    const atom1 = atom('1', () => {
      return isTracking ? signal.get() : untrack(() => signal.get())
    })

    const node1 = ecosystem.getNode(atom1)

    expect(node1.get()).toBe(0)
    expect(node1.s.size).toBe(1)

    signal.set(1)

    expect(node1.get()).toBe(1)

    isTracking = false
    node1.invalidate()
    signal.set(2)

    expect(node1.get()).toBe(1)
    expect(node1.s.size).toBe(0)
  })
})
