import { act, react, select } from 'vedux'


// will prefix all actor action types with 'todos/':
act = act.namespace('todos')


export const addTodo = act('addTodo')
  .payload(text => text) // for fun


const reactor = react([])
  .to(addTodo)
  .withReducers(split(addTodoReducer, addTodoErrorReducer))
  .withProcessors(addTodoProcessor)

  .to(other1, other2)
  .withReducers(otherReducer, otherReducer2, other2Reducer)

  .to('*')
  .toEverything() // an alias for to('*')
  .withReducers(someReducer)


export default reactor


export const selectIncompleteTodos = select(
  reactor,
  todos => todos.filter(todo => !todo.complete)
)






function addTodoReducer(state, action) {

}


function addTodoProcessor({ dispatch, getState }, action) {

}










import { hold } from 'vedux'

import todos from './reactors/todos'


export default hold()
  .use(a)
  .use(b) // would overwrite the existing hierarchy
  .use({ // would overwrite it again
    a,
    b
  })
  .use({
    c, // would be merged into the existing hierarchy
    b // would overwrite existing key
  })
  .use({
    b: { // would overwrite existing key
      d,
      e
    }
  })
  .use({
    a
  }, true) // set weakMerge to true (will not overwrite existing keys)








import store from './store'
import { addTodo, selectIncompleteTodos } from './todos'


store.dispatch()
store.getState()
store.hydrate()
store.inspect()
store.subscribe()
store.use()

addTodo('be awesome')
addTodo.error('the error message')

selectIncompleteTodos(store) // selectIncompleteTodos(store)(args)
selectIncompleteTodos.bind(store)()










{
  meta: '@@vedux/delegate',
  data: [ 'd', 'e', 'f' ],
  action: {
    type: 'addTodo',
    payload: 'be awesome'
  }
}




{
  meta: '@@vedux/delegate',
  data: [ 'a', 'b', 'c' ],
  action: {
    meta: '@@vedux/delegate',
    data: [ 'd', 'e', 'f' ],
    action: {
      type: 'addTodo',
      payload: 'be awesome'
    }
  }
}





{
  meta: '@@vedux/inherit',
  action: {
    type: 'addTodo',
    payload: 'be awesome'
  }
}











const store = createStore()
  .use({
    counterA,
    counterB
  })



const selectCounterA = select(state => state)
const selectCounterB = select(state => state)

const adaptCounterA = adapt(state => state.counterA)
const adaptCounterB = adapt(state => state.counterB)

const selectSum = select(
  adaptCounterA(selectCounterA),
  adaptCounterB(selectCounterB),
  (a, b) => a + b
)


selectSum(store.getState())











// state machines

transition(closed)
  .from(closed).to(opening)
  .from(opening).to(closing, open)
  .from(closing).to(opening, closed)
  .from(open).to(closing)



const waiting = state('waiting')

export const requestFinished = waiting

const requestSent = state('requestSent')
  .onEnter(dispatch => fetch('blah').then(
    result => dispatch(requestFinished(result))
  ))

export const sendRequest = requestSent


export default transition(waiting)
  .undirected(waiting, requestSent)


sendRequest('blah')









// wouldn't it be nice if a reactor could specify its inspector dependencies?

const weaponsReactor = react([ 'dagger' ])
  .to(buyWeapon)

  // this'll always assume we have enough gold, since it can't tell otherwise:
  .withProcessors(buyWeaponProcessor)

const store = createStore()
  .use({
    gold: goldReactor,
    weapons: weaponsReactor
  })
  .inspect((storeBase, action, cancel) => {

    // this is where the hasSufficientGold calculation has to take place
    if (selectGold(storeBase) < action.payload) cancel()
  })

// the processor requires the inspector.

// this is a cross-shape-scope problem.
// Processors are shape agnostic
// Inspectors are shape bound

// colocating selectors with reactors is also a cross-shape-scope problem.
// selectors are shape bound
// reactors are shape agnostic









// inducers

const store = createStore()

store.dispatch({ type: 'a' }) // throws Error

store.dispatch(state => 'new state') // works
store.getState() // 'new state'








// split helper

import { ifError } from 'zedux'

const reactor = react()
  .to(potionsFetched)
  .withReducers(ifError(potionsFetchFail, potionsFetchedSuccess))







/*
  Todos:

  - kill `ErrorAction`s and `actor.error()`
  - beef up processors
  - add "state can't be undefined" error checking/messages
  - add React usage guide
  - add Store composition guide

*/
