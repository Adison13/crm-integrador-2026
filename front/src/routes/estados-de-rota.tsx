import { FileQuestion, TriangleAlert } from 'lucide-react'
import { Link, useRouteError } from 'react-router'
import { Button, EmptyState, Spinner } from '@/components/ui'

export function CarregandoTela() {
  return <Spinner className="min-h-60" />
}

export function NaoEncontrada() {
  return (
    <EmptyState
      icon={<FileQuestion aria-hidden />}
      title="Página não encontrada"
      action={<Link to="/empresas"><Button variant="outline">Ir para Empresas</Button></Link>}
    >
      O endereço não corresponde a nenhuma tela do CRM.
    </EmptyState>
  )
}

/** Erro inesperado ao montar uma tela: o módulo continua de pé e a casca segue funcionando. */
export function ErroDeTela() {
  const erro = useRouteError()
  if (import.meta.env.DEV) console.error(erro)
  return (
    <EmptyState
      icon={<TriangleAlert aria-hidden />}
      title="Não foi possível abrir esta tela"
      action={<Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>}
    >
      Recarregue a página. Se o erro continuar, avise a equipe do CRM.
    </EmptyState>
  )
}
