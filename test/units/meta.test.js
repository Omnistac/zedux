import {
  addMeta,
  getMetaPayload,
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
  action: {
    type: 'b',
    payload: null
  }
}

const threeLayers = {
  metaType: 'a',
  action: {
    metaType: 'b',
    action: {
      metaType: 'c',
      metaPayload: 1,
      action: {
        type: 'd',
        payload: null
      }
    }
  }
}

const repeated = {
  metaType: 'a',
  metaPayload: 1,
  action: {
    metaType: 'b',
    metaPayload: 2,
    action: {
      metaType: 'a',
      metaPayload: 3,
      action: {
        metaType: 'b',
        metaPayload: 4,
        action: {
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
    expect(twoLayers.action).toBe(oneLayer)

  })


  test('creates the meta chain on a plain action', () => {

    let wrappedAction = addMeta(plainAction, 'a')

    expect(wrappedAction.metaType).toBe('a')
    expect(wrappedAction.action).toBe(plainAction)

  })


  test('adds a metaPayload property to the new meta node if a payload is passed', () => {

    let twoLayers = addMeta(oneLayer, 'c', 1)
    let fourLayers = addMeta(threeLayers, 'e')

    expect(oneLayer.metaPayload).not.toBeDefined()
    expect(twoLayers.metaPayload).toBe(1)
    expect(threeLayers.metaPayload).not.toBeDefined()
    expect(fourLayers.metaPayload).not.toBeDefined()

  })

})


describe('getMetaPayload()', () => {

  test('retrieves the metaPayload property from the first meta node with the given metaType in the meta chain', () => {

    expect(getMetaPayload(threeLayers, 'c')).toBe(1)
    expect(getMetaPayload(repeated, 'a')).toBe(1)
    expect(getMetaPayload(repeated, 'b')).toBe(2)

  })


  test('returns undefined if the given metaType is not found in the meta chain', () => {

    expect(getMetaPayload(plainAction, 'a')).not.toBeDefined()
    expect(getMetaPayload(oneLayer, 'b')).not.toBeDefined()
    expect(getMetaPayload(threeLayers, 'e')).not.toBeDefined()

  })

})


describe('hasMeta()', () => {

  test('does not find a non-existent action wrapper', () => {

    expect(hasMeta(plainAction, 'a')).toBe(false)
    expect(hasMeta(oneLayer, 'b')).toBe(false)
    expect(hasMeta(threeLayers, 'e')).toBe(false)

  })


  test('finds the action wrapper at the top of the meta chain', () => {

    expect(hasMeta(oneLayer, 'a')).toBe(true)
    expect(hasMeta(threeLayers, 'a')).toBe(true)

  })


  test('finds the action wrapper in the middle of the meta chain', () => {

    expect(hasMeta(threeLayers, 'b')).toBe(true)

  })


  test('finds the action wrapper at the end of the meta chain', () => {

    expect(hasMeta(threeLayers, 'c')).toBe(true)

  })

})


describe('removeAllMeta()', () => {

  test('removes all meta nodes from the meta chain, returning the wrapped action', () => {

    expect(removeAllMeta(oneLayer)).toBe(oneLayer.action)
    expect(removeAllMeta(threeLayers)).toBe(threeLayers.action.action.action)

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

    expect(removeMeta(oneLayer, 'a')).toBe(oneLayer.action)
    expect(removeMeta(threeLayers, 'a')).toBe(threeLayers.action)

  })


  test('non-mutatively removes a node in the middle of the chain', () => {

    let newChain = removeMeta(threeLayers, 'b')

    expect(newChain).not.toBe(threeLayers)

    expect(threeLayers.metaType).toBe('a')
    expect(newChain.metaType).toBe('a')

    expect(threeLayers.action.metaType).toBe('b')
    expect(newChain.action.metaType).toBe('c')

    expect(newChain.action).toBe(threeLayers.action.action)

  })


  test('non-mutatively removes a node at the end of the chain', () => {

    let newChain = removeMeta(threeLayers, 'c')

    expect(newChain).not.toBe(threeLayers)

    expect(threeLayers.metaType).toBe('a')
    expect(newChain.metaType).toBe('a')

    expect(threeLayers.action.metaType).toBe('b')
    expect(newChain.action.metaType).toBe('b')

    expect(threeLayers.action.action.metaType).toBe('c')
    expect(newChain.action.action.metaType).not.toBeDefined()

    expect(newChain.action.action).toBe(threeLayers.action.action.action)

  })


  test('removes only the first meta node with the given metaType in the meta chain', () => {

    let newChain = removeMeta(repeated, 'a')
    let newChain2 = removeMeta(newChain, 'a')

    expect(newChain).toBe(repeated.action)
    expect(newChain2).toMatchObject({
      metaType: 'b',
      action: {
        metaType: 'b',
        action: {
          type: 'c'
        }
      }
    })

  })

})
