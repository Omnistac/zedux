import {
  addMeta,
  getMetaData,
  hasMeta,
  removeMeta,
  removeAllMeta
} from '../../src/utils/meta'


const plainAction = {
  type: 'a',
  payload: null
}

const oneLayer = {
  metaType: 'a',
  payload: {
    type: 'b',
    payload: null
  }
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
        payload: null
      }
    }
  }
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
          payload: null
        }
      }
    }
  }
}


describe('addMeta()', () => {

  test('adds a meta node at the beginning of the meta chain', () => {

    let twoLayers = addMeta(oneLayer, 'c')

    expect(oneLayer.metaType).toBe('a')
    expect(twoLayers.metaType).toBe('c')
    expect(twoLayers.payload).toBe(oneLayer)

  })


  test('creates the meta chain on a plain action', () => {

    let wrappedAction = addMeta(plainAction, 'a')

    expect(wrappedAction.metaType).toBe('a')
    expect(wrappedAction.payload).toBe(plainAction)

  })


  test('adds a metaData property to the new meta node if a payload is passed', () => {

    let twoLayers = addMeta(oneLayer, 'c', 1)
    let fourLayers = addMeta(threeLayers, 'e')

    expect(oneLayer.metaData).not.toBeDefined()
    expect(twoLayers.metaData).toBe(1)
    expect(threeLayers.metaData).not.toBeDefined()
    expect(fourLayers.metaData).not.toBeDefined()

  })

})


describe('getMetaData()', () => {

  test('retrieves the metaData property from the first meta node with the given metaType in the meta chain', () => {

    expect(getMetaData(threeLayers, 'c')).toBe(1)
    expect(getMetaData(repeated, 'a')).toBe(1)
    expect(getMetaData(repeated, 'b')).toBe(2)

  })


  test('returns undefined if the given metaType is not found in the meta chain', () => {

    expect(getMetaData(plainAction, 'a')).not.toBeDefined()
    expect(getMetaData(oneLayer, 'b')).not.toBeDefined()
    expect(getMetaData(threeLayers, 'e')).not.toBeDefined()

  })

})


describe('hasMeta()', () => {

  test('does not find a non-existent action wrapper', () => {

    expect(hasMeta(plainAction, 'a')).toBe(false)
    expect(hasMeta(oneLayer, 'b')).toBe(false)
    expect(hasMeta(threeLayers, 'e')).toBe(false)

  })


  test('finds a node at the top of the meta chain', () => {

    expect(hasMeta(oneLayer, 'a')).toBe(true)
    expect(hasMeta(threeLayers, 'a')).toBe(true)

  })


  test('finds a node in the middle of the meta chain', () => {

    expect(hasMeta(threeLayers, 'b')).toBe(true)

  })


  test('finds a node at the end of the meta chain', () => {

    expect(hasMeta(threeLayers, 'c')).toBe(true)

  })

})


describe('removeAllMeta()', () => {

  test('removes all meta nodes from the meta chain, returning the wrapped action', () => {

    expect(removeAllMeta(oneLayer)).toBe(oneLayer.payload)
    expect(removeAllMeta(threeLayers)).toBe(threeLayers.payload.payload.payload)

  })


  test('returns an unwrapped action as-is', () => {

    expect(removeAllMeta(plainAction)).toBe(plainAction)

  })

})


describe('removeMeta()', () => {

  test('returns an unwrapped action as-is', () => {

    expect(removeMeta(plainAction)).toBe(plainAction)

  })


  test('returns the given meta chain as-is if no meta node is found with the given metaType', () => {

    expect(removeMeta(oneLayer, 'b')).toBe(oneLayer)
    expect(removeMeta(threeLayers, 'e')).toBe(threeLayers)

  })


  test('non-mutatively removes a node at the start of the chain', () => {

    expect(removeMeta(oneLayer, 'a')).toBe(oneLayer.payload)
    expect(removeMeta(threeLayers, 'a')).toBe(threeLayers.payload)

  })


  test('non-mutatively removes a node in the middle of the chain', () => {

    let newChain = removeMeta(threeLayers, 'b')

    expect(newChain).not.toBe(threeLayers)

    expect(threeLayers.metaType).toBe('a')
    expect(newChain.metaType).toBe('a')

    expect(threeLayers.payload.metaType).toBe('b')
    expect(newChain.payload.metaType).toBe('c')

    expect(newChain.payload).toBe(threeLayers.payload.payload)

  })


  test('non-mutatively removes a node at the end of the chain', () => {

    let newChain = removeMeta(threeLayers, 'c')

    expect(newChain).not.toBe(threeLayers)

    expect(threeLayers.metaType).toBe('a')
    expect(newChain.metaType).toBe('a')

    expect(threeLayers.payload.metaType).toBe('b')
    expect(newChain.payload.metaType).toBe('b')

    expect(threeLayers.payload.payload.metaType).toBe('c')
    expect(newChain.payload.payload.metaType).not.toBeDefined()

    expect(newChain.payload.payload).toBe(threeLayers.payload.payload.payload)

  })


  test('removes only the first meta node with the given metaType in the meta chain', () => {

    let newChain = removeMeta(repeated, 'a')
    let newChain2 = removeMeta(newChain, 'a')

    expect(newChain).toBe(repeated.payload)
    expect(newChain2).toMatchObject({
      metaType: 'b',
      payload: {
        metaType: 'b',
        payload: {
          type: 'c'
        }
      }
    })

  })

})
