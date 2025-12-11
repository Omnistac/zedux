import { ActionMeta } from '@zedux/core/types'
import { getMetaData, removeAllMeta, removeMeta } from '@zedux/core/api/meta'

const plainAction = {
  type: 'a',
  payload: null as any,
}

const oneLayer = {
  metaType: 'a',
  payload: {
    type: 'b',
    payload: null as any,
  },
}

const threeLayers = {
  metaType: 'a',
  payload: {
    metaType: 'b',
    payload: {
      metaType: 'c',
      metaData: 1,
      payload: {
        type: 'd',
        payload: null as any,
      },
    },
  },
}

const repeated = {
  metaType: 'a',
  metaData: 1,
  payload: {
    metaType: 'b',
    metaData: 2,
    payload: {
      metaType: 'a',
      metaData: 3,
      payload: {
        metaType: 'b',
        metaData: 4,
        payload: {
          type: 'c',
          payload: null as any,
        },
      },
    },
  },
}

describe('getMetaData()', () => {
  test('throws an error if given an invalid ActionChain', () => {
    expect(() =>
      // @ts-expect-error payload can't be null
      getMetaData({ metaType: 'a', payload: null }, 'b')
    ).toThrow(/invalid action chain/i)
  })

  test('retrieves the metaData property from the first meta node with the given metaType in the action chain', () => {
    expect(getMetaData(threeLayers, 'c')).toBe(1)
    expect(getMetaData(repeated, 'a')).toBe(1)
    expect(getMetaData(repeated, 'b')).toBe(2)
  })

  test('returns undefined if the given metaType is not found in the action chain', () => {
    expect(getMetaData(plainAction, 'a')).not.toBeDefined()
    expect(getMetaData(oneLayer, 'b')).not.toBeDefined()
    expect(getMetaData(threeLayers, 'e')).not.toBeDefined()
  })
})

describe('removeAllMeta()', () => {
  test('removes all meta nodes from the action chain, returning the wrapped action', () => {
    expect(removeAllMeta(oneLayer)).toBe(oneLayer.payload)
    expect(removeAllMeta(threeLayers)).toBe(threeLayers.payload.payload.payload)
  })

  test('returns an unwrapped action as-is', () => {
    expect(removeAllMeta(plainAction)).toBe(plainAction)
  })
})

describe('removeMeta()', () => {
  test('returns an unwrapped action as-is', () => {
    expect(removeMeta(plainAction, 'a')).toBe(plainAction)
  })

  test('returns the given action chain as-is if no meta node is found with the given metaType', () => {
    expect(removeMeta(oneLayer, 'b')).toBe(oneLayer)
    expect(removeMeta(threeLayers, 'e')).toBe(threeLayers)
  })

  test('non-mutatively removes a node at the start of the chain', () => {
    expect(removeMeta(oneLayer, 'a')).toBe(oneLayer.payload)
    expect(removeMeta(threeLayers, 'a')).toBe(threeLayers.payload)
  })

  test('non-mutatively removes a node in the middle of the chain', () => {
    const newChain = removeMeta(threeLayers, 'b')

    expect(newChain).not.toBe(threeLayers)

    expect(threeLayers.metaType).toBe('a')
    expect((newChain as ActionMeta).metaType).toBe('a')

    expect(threeLayers.payload.metaType).toBe('b')
    expect(newChain.payload.metaType).toBe('c')

    expect(newChain.payload).toBe(threeLayers.payload.payload)
  })

  test('non-mutatively removes a node at the end of the chain', () => {
    const newChain = removeMeta(threeLayers, 'c')

    expect(newChain).not.toBe(threeLayers)

    expect(threeLayers.metaType).toBe('a')
    expect((newChain as ActionMeta).metaType).toBe('a')

    expect(threeLayers.payload.metaType).toBe('b')
    expect(newChain.payload.metaType).toBe('b')

    expect(threeLayers.payload.payload.metaType).toBe('c')
    expect(newChain.payload.payload.metaType).not.toBeDefined()

    expect(newChain.payload.payload).toBe(threeLayers.payload.payload.payload)
  })

  test('removes only the first meta node with the given metaType in the action chain', () => {
    const newChain = removeMeta(repeated, 'a')
    const newChain2 = removeMeta(newChain, 'a')

    expect(newChain).toBe(repeated.payload)
    expect(newChain2).toMatchObject({
      metaType: 'b',
      payload: {
        metaType: 'b',
        payload: {
          type: 'c',
        },
      },
    })
  })
})
