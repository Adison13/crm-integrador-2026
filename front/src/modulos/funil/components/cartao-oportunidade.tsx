import { ArrowRight, TriangleAlert } from 'lucide-react'
import { Avatar, cx } from '@/components/ui'
import type { OportunidadeDto } from '@/model/oportunidade'
import { dataCurta, moedaCurta } from '@/lib/formato'
import { COR_PADRAO } from '../funil.types'

interface Props {
  oportunidade: OportunidadeDto
  empresa: string | undefined
  responsavel: string | null
  cor: string | null
  movendo: boolean
  /** Só com crm.oportunidade.editar. */
  arrastavel: boolean
  aoAbrir: () => void
}

/** Cartão do quadro (Tela 7): empresa, produto, valor, probabilidade, próximo passo e fechamento previsto. */
export function CartaoOportunidade({ oportunidade: o, empresa, responsavel, cor, movendo, arrastavel, aoAbrir }: Props) {
  const probabilidade = Math.min(Math.max(o.probabilidade ?? 0, 0), 100)
  return (
    <button
      type="button"
      draggable={arrastavel}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', o.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={aoAbrir}
      className={cx(
        'w-full rounded-lg border border-borda bg-superficie p-3 text-left shadow-sm transition-shadow hover:shadow-md',
        arrastavel && 'cursor-grab active:cursor-grabbing',
        movendo && 'opacity-50',
      )}
    >
      <p className="truncate text-xs font-bold text-titulo">{empresa ?? '—'}</p>
      <p className="truncate text-xs text-texto-3">{o.titulo}</p>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-titulo">{moedaCurta(o.valorImplantacao) ?? 'R$ —'}</span>
        <span className="text-xs text-texto-3">{o.probabilidade == null ? '—' : `${o.probabilidade}%`}</span>
      </div>
      {/* Largura e cor da barra são dados (probabilidade e cor da etapa), por isso inline */}
      <div aria-hidden className="mt-1.5 h-1 overflow-hidden rounded-full bg-superficie-2">
        <div className="h-full rounded-full" style={{ width: `${probabilidade}%`, backgroundColor: cor ?? COR_PADRAO }} />
      </div>

      {o.proximoPassoAtrasado ? (
        <p className="mt-2 flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <TriangleAlert aria-hidden className="mt-px size-3 shrink-0" />
          <span className="line-clamp-2">Atrasado: {o.proximoPasso}</span>
        </p>
      ) : (
        o.proximoPasso && (
          <p className="mt-2 flex items-start gap-1 text-xs text-texto-3">
            <ArrowRight aria-hidden className="mt-px size-3 shrink-0" />
            <span className="line-clamp-2">{o.proximoPasso}</span>
          </p>
        )
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {responsavel
          ? <span title={responsavel}><Avatar nome={responsavel} size="sm" tom="destaque" /></span>
          : <span className="text-[11px] text-texto-3">Sem responsável</span>}
        <span className="text-[11px] text-texto-3" title="Fechamento previsto">{dataCurta(o.dataPrevistaFechamento) ?? ''}</span>
      </div>
    </button>
  )
}
