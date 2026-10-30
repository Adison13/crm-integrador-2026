import type { RouteObject } from 'react-router'

/** /oportunidades/{id} é a rota que notificações e outros módulos usam para abrir uma oportunidade (§12.2). */
export const OportunidadesRoutes: RouteObject[] = [
  { path: 'oportunidades/:id?', lazy: () => import('./oportunidades-page').then((m) => ({ Component: m.OportunidadesPage })) },
]
