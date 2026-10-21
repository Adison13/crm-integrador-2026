import type { RouteObject } from 'react-router'

/** /contatos/{id} é a rota da busca global (§8.6): abre a lista com o detalhe por cima. */
export const ContatosRoutes: RouteObject[] = [
  { path: 'contatos/:id?', lazy: () => import('./contatos-page').then((m) => ({ Component: m.ContatosPage })) },
]
