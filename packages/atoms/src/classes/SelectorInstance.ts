import { DehydrationFilter, GraphEdge, SelectorGenerics } from '../types/index'
import { prefix } from '../utils/general'
import { destroyNodeFinish, destroyNodeStart } from '../utils/graph'
import { runSelector } from '../utils/selectors'
import { Ecosystem } from './Ecosystem'
import { ZeduxNode } from './ZeduxNode'

export class SelectorInstance<
  G extends SelectorGenerics = {
    Params: any[]
    State: any
    Template: any
  }
> extends ZeduxNode<G & { Events: any }> {
  public static $$typeof = Symbol.for(`${prefix}/SelectorInstance`)

  /**
   * @see ZeduxNode.s Selectors typically have observers. So we initialize this
   * upfront.
   */
  public o = new Map<ZeduxNode, GraphEdge>()

  /**
   * @see ZeduxNode.s Selectors typically have sources. So we initialize this
   * upfront.
   */
  public s = new Map<ZeduxNode, GraphEdge>()

  constructor(
    /**
     * @see ZeduxNode.e
     */
    public e: Ecosystem,

    /**
     * @see ZeduxNode.id
     */
    public id: string,

    /**
     * `t`emplate - the function or object reference of this selector or
     * selector config object
     *
     * @see ZeduxNode.t
     */
    public t: G['Template'],

    /**
     * @see ZeduxNode.p
     */
    public p: G['Params']
  ) {
    super()
    runSelector(this, true)
  }

  /**
   * @see ZeduxNode.destroy
   */
  public destroy(force?: boolean) {
    destroyNodeStart(this, force) && destroyNodeFinish(this)

    // don't delete the ref from this.e.b; this selector instance isn't
    // necessarily the only one using it (if the selector takes params). Just
    // let the WeakMap clean itself up.
  }

  /**
   * @see ZeduxNode.d
   */
  public d(options?: DehydrationFilter) {
    if (this.f(options)) return this.v
  }

  /**
   * @see ZeduxNode.h
   *
   * While selectors can be dehydrated for debugging purposes, they currently
   * can't be hydrated as part of SSR, etc. This is a no-op.
   */
  public h() {}

  /**
   * @see ZeduxNode.j
   */
  public j() {
    runSelector(this)
  }

  /**
   * @see ZeduxNode.m
   */
  public m() {
    this.destroy()
  }
}
