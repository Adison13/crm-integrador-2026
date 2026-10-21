import type { RouteObject } from 'react-router'

export const FunilRoutes: RouteObject[] = [
  { path: 'funil', lazy: () => import('./funil-page').then((m) => ({ Component: m.FunilPage })) },
]
