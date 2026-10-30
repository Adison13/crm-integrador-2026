import { RotateCw, TriangleAlert } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { mensagemDe } from '@/lib/erros'

/** Estado de erro de toda consulta: diz o que houve e oferece tentar de novo (design system §14). */
export function FalhaAoCarregar({ erro, aoTentarDeNovo }: { erro: unknown; aoTentarDeNovo: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlert aria-hidden />}
      title="Não foi possível carregar"
      action={
        <Button variant="outline" onClick={aoTentarDeNovo}>
          <RotateCw aria-hidden className="size-4" /> Tentar de novo
        </Button>
      }
    >
      {mensagemDe(erro)}
    </EmptyState>
  )
}
