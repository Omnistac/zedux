import store from './store/store'
import { addTodo, removeTodo } from './store/reactors/todos'
import visibilityFilter from './store/reactors/visibilityFilter'
import { selectTodos, selectIncompleteTodos } from './store/selectors'


store.subscribe(() => {
  console.log('store state changed', store.getState())
})

store.dispatch(addTodo('be awesome'))
store.dispatch(addTodo('be cool'))
store.dispatch(addTodo('be smart'))
store.dispatch(addTodo('be the best'))
store.dispatch(addTodo('be like a boss'))

store.dispatch(removeTodo(1))
store.dispatch(removeTodo(3))


setTimeout(() => {
  store.use({
    visibilityFilter
  })
}, 1000)


// let start = performance.now()
//
// for (let i = 0; i < 100000; i++) {
//   store.dispatch(addTodo('a'))
//   store.dispatch(removeTodo(0))
// }
//
// let end = performance.now()
//
// console.log('total time:', end - start)
