import { QueryClient } from '@tanstack/react-query'
import { ErroDaApi } from '@/plataforma/api'

/** Erros que não melhoram tentando de novo: sem sessão, sem permissão ou registro inexistente. */
const SEM_NOVA_TENTATIVA = new Set([401, 403, 404])

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: (tentativas, erro) =>
        !(erro instanceof ErroDaApi && SEM_NOVA_TENTATIVA.has(erro.status)) && tentativas < 2,
    },
    mutations: { retry: false },
  },
})
