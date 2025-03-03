import { DehydrationFilter, SelectorGenerics } from '../types/index'
import { prefix } from '../utils/general'
import { destroyNodeFinish, destroyNodeStart } from '../utils/graph'
import { runSelector } from '../utils/selectors'
import { Ecosystem } from './Ecosystem'
import { GraphNode } from './GraphNode'

export class SelectorInstance<
  G extends SelectorGenerics = {
    Params: any[]
    State: any
    Template: any
  }
> extends GraphNode<G & { Events: any }> {
  public static $$typeof = Symbol.for(`${prefix}/SelectorInstance`)

  constructor(
    /**
     * @see GraphNode.e
     */
    public e: Ecosystem,

    /**
     * @see GraphNode.id
     */
    public id: string,

    /**
     * `t`emplate - the function or object reference of this selector or
     * selector config object
     *
     * @see GraphNode.t
     */
    public t: G['Template'],

    /**
     * @see GraphNode.p
     */
    public p: G['Params']
  ) {
    super()
    runSelector(this, true)
  }

  /**
   * @see GraphNode.destroy
   */
  public destroy(force?: boolean) {
    destroyNodeStart(this, force) && destroyNodeFinish(this)

    // don't delete the ref from this.e.b; this selector instance isn't
    // necessarily the only one using it (if the selector takes params). Just
    // let the WeakMap clean itself up.
  }

  /**
   * @see GraphNode.d
   */
  public d(options?: DehydrationFilter) {
    if (this.f(options)) return this.v
  }

  /**
   * @see GraphNode.h
   *
   * While selectors can be dehydrated for debugging purposes, they currently
   * can't be hydrated as part of SSR, etc. This is a no-op.
   */
  public h() {}

  /**
   * @see GraphNode.j
   */
  public j() {
    runSelector(this)
  }

  /**
   * @see GraphNode.m
   */
  public m() {
    this.destroy()
  }
}
