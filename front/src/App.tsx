import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { EntradaDeTeste } from './desenvolvimento/entrada-de-teste'
import { useSessao } from './hooks/use-sessao'
import { queryClient } from './lib/query-client'
import { ErroDaApi } from './plataforma/api'
import { estaEmbutido } from './plataforma/sessao'
import { router } from './routes/app-router'

export function App() {
  // useSyncExternalStore relê a sessão guardada fora dos componentes: a plataforma:sessao que
  // chegar antes do primeiro render não se perde (Contrato §12.2)
  const sessao = useSessao()
  const usuarioId = sessao?.usuario.id
  const token = sessao?.token

  // Sessão encerrada ou outro usuário: o cache de quem saiu é descartado e nada dele aparece para o próximo
  useEffect(() => () => queryClient.clear(), [usuarioId])

  // A casca renovou o token (plataforma:token): refaz o que tinha falhado com 401
  useEffect(() => {
    if (!token) return
    void queryClient.invalidateQueries({
      predicate: (q) => q.state.error instanceof ErroDaApi && q.state.error.status === 401,
    })
  }, [token])

  if (!sessao) return estaEmbutido() ? <Aguardando /> : <EntradaDeTeste />

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

function Aguardando() {
  return (
    <main className="grid min-h-40 place-items-center p-6 text-sm text-texto-3">
      Aguardando a sessão da plataforma…
    </main>
  )
}
