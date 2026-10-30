import type { RouteObject } from 'react-router'

export const ProspeccaoRoutes: RouteObject[] = [
  { path: 'prospeccao', lazy: () => import('./prospeccao-page').then((m) => ({ Component: m.ProspeccaoPage })) },
]
