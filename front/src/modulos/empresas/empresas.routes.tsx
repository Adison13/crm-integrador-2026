import type { RouteObject } from 'react-router'

/** /empresas/{id} é a rota da busca global (§8.6): abre a lista com o detalhe por cima. */
export const EmpresasRoutes: RouteObject[] = [
  { path: 'empresas/:id?', lazy: () => import('./empresas-page').then((m) => ({ Component: m.EmpresasPage })) },
]
