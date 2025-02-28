import { atom, injectHydration, injectSignal } from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'

describe('ssr', () => {
  test('injectHydration intercepts automatic hydration', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      const hydration = injectHydration()
      calls.push(hydration)

      // make state something that doesn't match the hydration:
      return injectSignal(hydration + 'c')
    })

    ecosystem.hydrate({ 1: 'ab' })

    const node = ecosystem.getNode(atom1)

    expect(calls).toEqual(['ab'])
    expect(node.get()).toBe('abc')
  })

  test('injectHydration({ intercept: false }) does not intercept automatic hydration', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      const hydration = injectHydration({ intercept: false })
      calls.push(hydration)

      // make state something that doesn't match the hydration:
      return injectSignal(hydration + 'c')
    })

    ecosystem.hydrate({ 1: 'ab' })

    const node = ecosystem.getNode(atom1)

    expect(calls).toEqual(['ab', 'ab'])
    expect(node.get()).toBe('ab')
  })

  test('injectHydration transforms the value by default', () => {
    const atom1 = atom(
      '1',
      () => {
        const value = injectHydration<number>()

        return value
      },
      {
        hydrate: val => (val as number) + 1,
      }
    )

    ecosystem.hydrate({ 1: 1 })

    const node = ecosystem.getNode(atom1)

    expect(node.get()).toBe(2)
  })

  test('injectHydration({ transform: false }) prevents transformation', () => {
    const atom1 = atom(
      '1',
      () => {
        const value = injectHydration<number>({ transform: false })

        return value
      },
      {
        hydrate: val => (val as number) + 1,
      }
    )

    ecosystem.hydrate({ 1: 1 })

    const node = ecosystem.getNode(atom1)

    expect(node.get()).toBe(1)
  })
})
