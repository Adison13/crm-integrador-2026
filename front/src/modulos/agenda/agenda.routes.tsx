import type { RouteObject } from 'react-router'

export const AgendaRoutes: RouteObject[] = [
  { path: 'agenda', lazy: () => import('./agenda-page').then((m) => ({ Component: m.AgendaPage })) },
]
