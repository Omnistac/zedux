import { atom, createStore, injectStore, ion } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'

describe('ssr', () => {
  test('ecosystem.hydrate() requires a normal object', () => {
    expect(() => ecosystem.hydrate([])).toThrowError(/plain object/)
  })

  test('ecosystem.hydrate() hydrates atoms retroactively by default', () => {
    const atom1 = atom('1', () => 'a')
    const instance1 = ecosystem.getInstance(atom1)

    ecosystem.hydrate({
      1: 'b',
    })

    expect(instance1.getState()).toBe('b')
    expect(ecosystem.dehydrate()).toEqual({
      1: 'b',
    })
  })

  test('retroactive hydration can be turned off', () => {
    const atom1 = atom('1', () => 'a')
    const instance1 = ecosystem.getInstance(atom1)

    ecosystem.hydrate(
      {
        1: 'b',
      },
      { retroactive: false }
    )

    expect(instance1.getState()).toBe('a')
    expect(ecosystem.dehydrate()).toEqual({
      1: 'a',
    })
  })

  test('hydrations can apply retroactively and going forward', () => {
    const atom1 = atom('1', () => 'a')
    const atom2 = atom('2', () => 'b')
    const instance1 = ecosystem.getInstance(atom1)

    ecosystem.hydrate({
      1: 'aa',
      2: 'bb',
    })

    expect(instance1.getState()).toBe('aa')
    expect(ecosystem.dehydrate()).toEqual({
      1: 'aa',
    })

    // should be hydrated on creation:
    const instance2 = ecosystem.getInstance(atom2)

    expect(instance2.getState()).toBe('bb')
    expect(ecosystem.dehydrate()).toEqual({
      1: 'aa',
      2: 'bb',
    })
  })

  test('atom transform options transform hydrated values', () => {
    const atom1 = atom('1', () => new Map([['a', 1]]), {
      dehydrate: m => Object.fromEntries(m.entries()),
      hydrate: obj => {
        if (typeof obj === 'object' && obj) {
          return new Map(Object.entries(obj))
        }
        return new Map()
      },
    })

    ecosystem.hydrate({
      1: { aa: 11 },
    })

    const instance1 = ecosystem.getInstance(atom1)

    expect([...instance1.getState().entries()]).toEqual([['aa', 11]])

    instance1.setState(new Map([['aaa', 111]]))

    expect(ecosystem.dehydrate()).toEqual({
      1: { aaa: 111 },
    })
  })

  test('retroactive hydration uses the `hydrate` transform option', () => {
    const atom1 = atom('1', () => new Map([['a', 1]]), {
      dehydrate: m => Object.fromEntries(m.entries()),
      hydrate: obj => {
        if (typeof obj === 'object' && obj) {
          return new Map(Object.entries(obj))
        }
        return new Map()
      },
    })

    const instance1 = ecosystem.getInstance(atom1)

    ecosystem.hydrate({
      1: { aa: 11 },
    })

    expect([...instance1.getState().entries()]).toEqual([['aa', 11]])

    instance1.setState(new Map([['aaa', 111]]))

    expect(ecosystem.dehydrate()).toEqual({
      1: { aaa: 111 },
    })
  })

  test('`ecosystem.dehydrate({ exclude })` excludes atoms from dehydration', () => {
    const atom1 = atom('1', 'a')
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    ecosystem.getInstance(atom2)

    expect(ecosystem.dehydrate()).toEqual({
      1: 'a',
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ exclude: ['1'] })).toEqual({
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ exclude: ['2'] })).toEqual({
      1: 'a',
    })

    expect(ecosystem.dehydrate({ exclude: [atom1] })).toEqual({
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ exclude: [atom2] })).toEqual({
      1: 'a',
    })

    expect(ecosystem.dehydrate({ exclude: ['1', atom2] })).toEqual({})
  })

  test('`ecosystem.dehydrate({ excludeFlags })` excludes atoms from dehydration', () => {
    const atom1 = atom('1', 'a', { flags: ['exclude-me'] })
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    ecosystem.getInstance(atom2)

    expect(ecosystem.dehydrate()).toEqual({
      1: 'a',
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ excludeFlags: ['exclude-me'] })).toEqual({
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ excludeFlags: ['nonexistent-flag'] })).toEqual(
      {
        1: 'a',
        2: 'ab',
      }
    )
  })

  test('`ecosystem.dehydrate({ include })` includes atoms in dehydration', () => {
    const atom1 = atom('1', 'a')
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    ecosystem.getInstance(atom2)

    expect(ecosystem.dehydrate()).toEqual({
      1: 'a',
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ include: ['1'] })).toEqual({
      1: 'a',
    })

    expect(ecosystem.dehydrate({ include: ['2'] })).toEqual({
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ include: [atom1] })).toEqual({
      1: 'a',
    })

    expect(ecosystem.dehydrate({ include: [atom2] })).toEqual({
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ include: ['1', atom2] })).toEqual({
      1: 'a',
      2: 'ab',
    })
  })

  test('`ecosystem.dehydrate({ includeFlags })` includes atoms in dehydration', () => {
    const atom1 = atom('1', 'a', { flags: ['include-me'] })
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    ecosystem.getInstance(atom2)

    expect(ecosystem.dehydrate()).toEqual({
      1: 'a',
      2: 'ab',
    })

    expect(ecosystem.dehydrate({ includeFlags: ['include-me'] })).toEqual({
      1: 'a',
    })

    expect(ecosystem.dehydrate({ includeFlags: ['nonexistent-flag'] })).toEqual(
      {}
    )
  })

  test('excludes take precedence over includes', () => {
    const atom1 = atom('1', 'a', { flags: ['include-me', 'exclude-me'] })
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    ecosystem.getInstance(atom2)

    expect(
      ecosystem.dehydrate({ excludeFlags: ['exclude-me'], include: [atom1] })
    ).toEqual({})

    expect(ecosystem.dehydrate({ exclude: [atom2], include: [atom2] })).toEqual(
      {}
    )

    expect(
      ecosystem.dehydrate({
        exclude: [atom2],
        include: [atom2],
        includeFlags: ['include-me'],
      })
    ).toEqual({
      1: 'a',
    })

    expect(
      ecosystem.dehydrate({
        exclude: [atom2],
        excludeFlags: ['exclude-me'],
        include: [atom2],
        includeFlags: ['include-me'],
      })
    ).toEqual({})
  })

  test('all injectors receive the hydration', () => {
    const atom1 = atom(
      '1',
      () => {
        const a = injectStore('a', { hydrate: true })
        const b = injectStore('b', { hydrate: true })

        const store = injectStore(() => createStore({ a, b }))
        store.use({ a, b })

        return store
      },
      { manualHydration: true }
    )

    ecosystem.hydrate({ 1: 'ab' })
    const instance = ecosystem.getInstance(atom1)

    expect(instance.getState()).toEqual({
      a: 'ab',
      b: 'ab',
    })
  })
})
