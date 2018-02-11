import { compose, select } from 'zedux'

import * as hooks from './hooks'
import * as selectors from './selectors'
import store from './store'

import {
  addTodo,
  clearComplete,
  editTodo,
  removeTodo,
  toggleAllComplete,
  toggleComplete
} from './todos'

import { showAll, showComplete, showIncomplete } from './visibilityFilter'


const actors = {
  clearComplete,
  editTodo,
  removeTodo,
  showAll,
  showComplete,
  showIncomplete,
  toggleComplete,
  wrappedActors: {
    addTodo,
    toggleAllComplete
  }
}


export default createStoreApi({
  actors,
  hooks,
  selectors,
  store
})


function assertKeyDoesNotExist(storeApi, key) {
  if (!storeApi[key]) return true

  throw new Error(
    'React Zedux Error - createStoreApi() - '
    + `Duplicate key ${key} found.`
  )
}


export function createStoreApi({ actors, hooks, selectors, store }) {
	const { dispatch, getState } = store
	const storeApi = { ...store }

	addActors(storeApi, actors, dispatch)
  addHooks(storeApi, hooks)
  addSelectors(storeApi, selectors, getState)

	return storeApi
}


function addActors(storeApi, actors, dispatch) {
  if (!actors) return

  // Bind each actor to the store
  Object.entries(actors).forEach(([ key, actor ]) => {
		assertKeyDoesNotExist(storeApi, key)

    // Allow for nested actor collections.
    if (typeof actor !== 'function') {
      const namespace = {}

      addActors(namespace, actor, dispatch)

      return storeApi[key] = namespace
    }

		const boundActor = compose(dispatch, actor)
		boundActor.type = actor.type

		storeApi[key] = boundActor
	})
}


function addHooks(storeApi, hooks) {
  if (!hooks) return

	Object.entries(hooks).forEach(([ key, hook ]) => {
		assertKeyDoesNotExist(storeApi, key)

    // Allow for nested hook collections.
    if (typeof hook !== 'function') {
      const namespace = {}

      addHooks(namespace, hook, dispatch)

      return storeApi[key] = namespace
    }

		// Prime the curried hooks with the storeApi
		// It'll be fully mutated before any inner functions are called.
		storeApi[key] = hook(storeApi)
	})
}


function addSelectors(storeApi, selectors, getState) {
  if (!selectors) return

  // Bind each selector to the store
  Object.entries(selectors).forEach(([ key, selector ]) => {
		assertKeyDoesNotExist(storeApi, key)

    // Allow for nested selector collections.
    if (typeof selector !== 'function') {
      const namespace = {}

      addSelectors(namespace, selector, dispatch)

      return storeApi[key] = namespace
    }

		storeApi[key] = (...args) => selector(getState(), ...args)
	})
}
