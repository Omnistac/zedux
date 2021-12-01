import { ActorActionType } from '@zedux/core'
import { ActiveState, AnyAtomInstance, Mod, ZeduxPlugin } from '@zedux/react'

export interface AtomInstanceSnapshot {
  activeState: ActiveState
  instance: AnyAtomInstance
  state: any
}

export enum GlobalFilter {
  Atom = 'Atom',
  AtomFlags = 'AtomFlags',
  AtomInstance = 'AtomInstance',
  AtomInstanceActiveState = 'AtomInstanceActiveState',
  AtomInstanceKeyHash = 'AtomInstanceKeyHash',
}

export type GridNum = 0 | 1 | 2

export interface GridProps {
  col: GridNum
  row: GridNum
}

export enum Importance {
  High,
  Medium,
  Low,
  Dirt,
}

export interface LogEvent<T extends Mod = Mod> {
  action: ActorActionType<ZeduxPlugin['constructor']['actions'][T]>
  id: string
  timestamp: number
}

export type Pos =
  | 'topLeft'
  | 'top'
  | 'topRight'
  | 'left'
  | 'center'
  | 'right'
  | 'bottomLeft'
  | 'bottom'
  | 'bottomRight'

export enum RectType {
  Xs,
  Sm,
  Md,
  Lg,
  Xl,
}

export enum Route {
  Atoms = 'Atoms',
  Dashboard = 'Dashboard',
  Graph = 'Graph',
  Log = 'Log',
  Settings = 'Settings',
}

export type Size = 0 | 1 | 2 | 3 | 4 | 5
