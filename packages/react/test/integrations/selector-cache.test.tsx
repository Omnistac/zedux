import { atom, AtomGetters, createEcosystem } from '@zedux/react'

const ecosystem = createEcosystem({
  id: 'selector-cache-test',
})

afterEach(() => {
  ecosystem.reset()
})

describe('selector cache', () => {
  test('deeply nested selectors get auto-created', () => {
    const atom1 = atom('1', () => 'a')
    const selector1 = ({ get }: AtomGetters) => get(atom1) + 'b'
    const selector2 = ({ select }: AtomGetters) => select(selector1) + 'c'
    const selector3 = ({ select }: AtomGetters) => select(selector2) + 'd'

    const cache = ecosystem.selectors.getCache(selector3)
    const cache3 = {
      args: [],
      id: '@@selector-selector3',
      nextEvaluationReasons: [],
      prevEvaluationReasons: [],
      result: 'abcd',
      selectorRef: selector3,
    }

    expect(cache).toEqual(cache3)

    expect(ecosystem.selectors._items).toEqual({
      '@@selector-selector1': {
        args: [],
        id: '@@selector-selector1',
        nextEvaluationReasons: [],
        prevEvaluationReasons: [],
        result: 'ab',
        selectorRef: selector1,
      },
      '@@selector-selector2': {
        args: [],
        id: '@@selector-selector2',
        nextEvaluationReasons: [],
        prevEvaluationReasons: [],
        result: 'abc',
        selectorRef: selector2,
      },
      [cache3.id]: cache3,
    })
  })
})
