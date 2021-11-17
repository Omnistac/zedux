import { atom } from '@zedux/react'

export enum Route {
  Dashboard = 'Dashboard',
  Inspect = 'Inspect',
  Monitor = 'Monitor',
}

export const routeAtom = atom('route', () => Route.Dashboard)
