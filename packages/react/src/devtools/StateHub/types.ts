import { EvaluationReason } from '@zedux/react'

export type GridNum = 0 | 1 | 2

export interface GridProps {
  col: GridNum
  row: GridNum
}

export interface MonitorLogEvent {
  reasons?: EvaluationReason[]
  timestamp: number
  type: MonitorLogEventType
}

export enum MonitorLogEventType {
  AtomInstanceUpdated = 'Atom Instance Updated',
  EdgeCreated = 'Graph Edge Created (Ghost Edge Materialized)',
  EdgeRemoved = 'Graph Edge Removed',
  GhostEdgeCreated = 'Graph Ghost Edge Created',
  GhostEdgeremoved = 'Graph Ghost Edge Removed (Without Materializing)',
  InstanceCreated = 'Atom Instance Created',
  InstanceUpdated = 'Atom Instance Updated',
  InstanceDestroyed = 'Atom Instance Destroyed',
  InstanceActiveStateChanged = 'Atom Instance Active State Changed',
  EcosystemWiped = 'Ecosystem Wiped',
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

export type Size = 0 | 1 | 2 | 3 | 4 | 5
