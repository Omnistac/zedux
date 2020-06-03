import { createActorFactory } from '@zedux'
import { Todo } from '../../types'

const createActor = createActorFactory('@todos')

export const addTodo = createActor<string>('add')
export const clearComplete = createActor('clearComplete')
export const removeTodo = createActor<string>('remove')
export const toggleAllComplete = createActor<boolean>('toggleAllComplete')
export const toggleComplete = createActor<string>('toggleComplete')
export const updateTodo = createActor<Pick<Todo, 'id' | 'text'>>('update')
