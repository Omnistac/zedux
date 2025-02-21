import { Store } from '@zedux/core'
import { Draft, produce } from 'immer'

export class ImmerStore<State> extends Store<State> {
  public constructor(initialState?: State) {
    super(null, initialState)
  }

  public produce(recipe: (draft: Draft<State>) => any) {
    this.setState(
      produce(this.getState(), draft => {
        recipe(draft) // don't return the result - user should use store.setState() to override state
      })
    )
  }
}
