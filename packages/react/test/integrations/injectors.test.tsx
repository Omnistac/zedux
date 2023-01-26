import {
  atom,
  createEcosystem,
  injectCallback,
  injectEffect,
  injectMemo,
  injectRef,
  injectStore,
} from '@zedux/react'

const ecosystem = createEcosystem({ id: 'test-injectors' })

afterEach(() => {
  ecosystem.reset()
})

describe('injectors', () => {
  test('React-esque injectors mimic React hook functionality', () => {
    const ref = {}
    const cbs: (() => void)[] = []
    const cleanups: string[] = []
    const effects: string[] = []
    const refs: typeof ref[] = []
    const vals: string[] = []
    const cbA = () => {}
    const cbB = () => {}

    const atom1 = atom('1', () => {
      const store = injectStore('a')
      const val1 = injectMemo(() => store.getState())
      const val2 = injectMemo(() => store.getState(), [])
      const val3 = injectMemo(() => store.getState(), [store.getState()])
      vals.push(val1, val2, val3)

      const injectedRef = injectRef(ref)
      refs.push(injectedRef.current)

      const cb1 = injectCallback(store.getState() === 'a' ? cbA : cbB)
      const cb2 = injectCallback(store.getState() === 'a' ? cbA : cbB, [])
      const cb3 = injectCallback(store.getState() === 'a' ? cbA : cbB, [
        store.getState(),
      ])
      cbs.push(cb1, cb2, cb3)

      injectEffect(() => {
        effects.push(store.getState())

        return () => cleanups.push(store.getState())
      }, [store.getState()])

      return store
    })

    const instance = ecosystem.getInstance(atom1)

    instance.setState('b')

    expect(vals).toEqual(['a', 'a', 'a', 'b', 'a', 'b'])
    expect(cbs).toEqual([cbA, cbA, cbA, cbB, cbA, cbB])
    expect(effects).toEqual(['b'])
    expect(cleanups).toEqual([])
    expect(refs).toEqual([ref, ref])

    instance.setState('c')

    expect(vals).toEqual(['a', 'a', 'a', 'b', 'a', 'b', 'c', 'a', 'c'])
    expect(cbs).toEqual([cbA, cbA, cbA, cbB, cbA, cbB, cbB, cbA, cbB])
    expect(effects).toEqual(['b', 'c'])
    expect(cleanups).toEqual(['c'])
    expect(refs).toEqual([ref, ref, ref])
  })
})
