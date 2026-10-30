import { createBrowserRouter, Navigate } from 'react-router'
import { AgendaRoutes } from '@/modulos/agenda/agenda.routes'
import { ContatosRoutes } from '@/modulos/contatos/contatos.routes'
import { EmpresasRoutes } from '@/modulos/empresas/empresas.routes'
import { FunilRoutes } from '@/modulos/funil/funil.routes'
import { OportunidadesRoutes } from '@/modulos/oportunidades/oportunidades.routes'
import { ProspeccaoRoutes } from '@/modulos/prospeccao/prospeccao.routes'
import { TarefasRoutes } from '@/modulos/tarefas/tarefas.routes'
import { CarregandoTela, ErroDeTela, NaoEncontrada } from './estados-de-rota'
import { ModuloLayout } from './modulo-layout'

/** "/modulos/crm": o roteador usa o mesmo prefixo do base do Vite (Contrato §12.8). */
const PREFIXO = import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter(
  [
    {
      element: <ModuloLayout />,
      HydrateFallback: CarregandoTela,
      children: [
        {
          // Erro de uma tela não derruba o layout: o menu continua na tela
          errorElement: <ErroDeTela />,
          // As mesmas rotas do itensSubmenu de modulos/crm.json, na ordem do menu
          children: [
            { index: true, element: <Navigate to="/empresas" replace /> },
            ...EmpresasRoutes,
            ...ContatosRoutes,
            ...FunilRoutes,
            ...OportunidadesRoutes,
            ...TarefasRoutes,
            ...AgendaRoutes,
            ...ProspeccaoRoutes,
            { path: '*', Component: NaoEncontrada },
          ],
        },
      ],
    },
  ],
  { basename: PREFIXO },
)
