import { render } from '@testing-library/react'
import { atom, ecosystem, injectStore, injectWhy } from '@zedux/react'
import React from 'react'

const testEcosystem = ecosystem({ id: 'test' })

afterEach(() => {
  testEcosystem.wipe()
})

describe('ecosystem', () => {
  test('big graph', async () => {
    const evaluations: number[] = []
    const evaluate1 = jest.fn(() => evaluations.push(1))
    const evaluate2 = jest.fn(() => evaluations.push(2))
    const evaluate3 = jest.fn(() => evaluations.push(3))
    const evaluate4 = jest.fn(() => evaluations.push(4))
    const evaluate5 = jest.fn(() => evaluations.push(5))
    const childRendered = jest.fn()
    const why5 = jest.fn()

    const atom1 = atom('atom1', () => {
      evaluate1()
      const store = injectStore('1', true)

      return store
    })

    const atom2 = atom('atom2', () => {
      evaluate2()
      const atom1val = atom1.injectValue()

      return `${atom1val} 2`
    })

    const atom3 = atom('atom3', (id: string) => {
      evaluate3()
      const atom1val = atom1.injectValue()
      const atom2val = atom2.injectValue()

      return `${id} ${atom1val} ${atom2val}`
    })

    const atom4 = atom('atom4', () => {
      evaluate4()
      const atom3val = atom3.injectValue('1')
      const atom1val = atom1.injectValue()

      return `${atom3val} ${atom1val}`
    })

    const atom5 = atom('atom5', () => {
      evaluate5()
      const atom2val = atom2.injectValue()
      const atom4val = atom4.injectValue()
      const atom1val = atom1.injectValue()

      injectWhy(why5)

      return `${atom4val} ${atom2val} ${atom1val}`
    })

    function Child() {
      const atom5val = atom5.useValue()
      const atom4val = atom4.useValue()
      const atom3val = atom3.useValue('1')
      const atom2val = atom2.useValue()
      const atom1val = atom1.useValue()

      childRendered(atom5val, atom4val, atom3val, atom2val, atom1val)

      return (
        <>
          <div>{atom1val}</div>
          <div>{atom2val}</div>
          <div>{atom3val}</div>
          <div>{atom4val}</div>
          <div>{atom5val}</div>
        </>
      )
    }

    function Test() {
      return (
        <testEcosystem.Provider>
          <Child />
        </testEcosystem.Provider>
      )
    }

    const { findByText } = render(<Test />)

    expect(testEcosystem.instances).toEqual({
      atom1: expect.any(Object),
      atom2: expect.any(Object),
      'atom3-["1"]': expect.any(Object),
      atom4: expect.any(Object),
      atom5: expect.any(Object),
    })
    expect(childRendered).toHaveBeenCalledTimes(1)
    expect(childRendered).toHaveBeenLastCalledWith(
      '1 1 1 2 1 1 2 1',
      '1 1 1 2 1',
      '1 1 1 2',
      '1 2',
      '1'
    )
    expect(evaluations).toEqual([5, 2, 1, 4, 3])

    testEcosystem.load(atom1).setState('0')

    await findByText('1 0 0 2 0 0 2 0')

    expect(childRendered).toHaveBeenCalledTimes(6) // unfortunate but what can be done
    expect(childRendered).toHaveBeenLastCalledWith(
      '1 0 0 2 0 0 2 0',
      '1 0 0 2 0',
      '1 0 0 2',
      '0 2',
      '0'
    )
    expect(evaluations).toEqual([5, 2, 1, 4, 3, 1, 2, 3, 4, 5])
  })
})
