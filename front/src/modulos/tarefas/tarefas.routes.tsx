import type { RouteObject } from 'react-router'

export const TarefasRoutes: RouteObject[] = [
  { path: 'tarefas', lazy: () => import('./tarefas-page').then((m) => ({ Component: m.TarefasPage })) },
]
