import { EMPTY_CONTEXT } from '@zedux/react/utils'
import { Context, createContext } from 'react'
import { AtomInstance } from '../AtomInstance'
import { AtomBase } from './AtomBase'

export abstract class StandardAtomBase<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomBase<State, Params, AtomInstance<State, Params, Exports>> {
  private reactContext?: Context<any>

  public getReactContext() {
    if (this.reactContext) return this.reactContext

    return (this.reactContext = createContext(EMPTY_CONTEXT))
  }
}
