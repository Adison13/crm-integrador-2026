import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { avisarNavegacao } from '@/plataforma/sessao'

/**
 * Raiz de todas as telas. Menu, cabeçalho, busca global e notificações são da casca (Contrato §3
 * e §12): o módulo desenha só o conteúdo da página, embutido ou aberto direto.
 */
export function ModuloLayout() {
  const { pathname, search } = useLocation()

  // Reflete a rota interna na URL da casca, para recarregar e voltar funcionarem (§12.2, RF38)
  useEffect(() => {
    avisarNavegacao(pathname + search)
  }, [pathname, search])

  // Sem min-h-dvh: dentro do iframe, dvh é a altura que a casca deu ao próprio iframe, e a
  // página nunca encolheria depois de uma lista longa (modulo:altura só cresceria)
  return (
    <main className="flex flex-col">
      <Outlet />
    </main>
  )
}
