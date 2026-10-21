import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { cx } from '@/components/ui'
import type { EtapaDto } from '@/model/funil'
import { moedaCurta } from '@/lib/formato'
import { COR_PADRAO } from '../funil.types'

interface Props {
  etapa: EtapaDto
  quantidade: number
  total: number
  /** Ausente sem crm.oportunidade.editar: a coluna não aceita cartão. */
  aoSoltar?: (oportunidadeId: string) => void
  /** Ausente sem crm.oportunidade.criar. */
  aoAdicionar?: () => void
  children: ReactNode
}

/** Coluna do quadro: cabeçalho na cor da etapa com a soma e a contagem, e área que aceita cartões arrastados. */
export function ColunaEtapa({ etapa, quantidade, total, aoSoltar, aoAdicionar, children }: Props) {
  const [recebendo, setRecebendo] = useState(false)
  return (
    <section aria-label={`Etapa ${etapa.nome}`} className="flex w-72 shrink-0 flex-col">
      {/* A cor é da etapa (dado gravado no back-end), por isso inline */}
      <header className="rounded-t-xl px-3 py-2.5 text-white" style={{ backgroundColor: etapa.cor ?? COR_PADRAO }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-bold">{etapa.nome}</h2>
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold">{quantidade}</span>
        </div>
        <p className="mt-0.5 text-xs text-white/85">{moedaCurta(total)}</p>
      </header>
      <div
        onDragOver={(e) => {
          if (!aoSoltar) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setRecebendo(true)
        }}
        onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setRecebendo(false)}
        onDrop={(e) => {
          e.preventDefault()
          setRecebendo(false)
          const id = e.dataTransfer.getData('text/plain')
          if (id) aoSoltar?.(id)
        }}
        className={cx(
          'flex min-h-96 flex-1 flex-col gap-2 rounded-b-xl border border-t-0 p-2 transition-colors',
          recebendo ? 'border-brand-700 bg-brand-50 dark:bg-brand-800/20' : 'border-borda bg-superficie-2',
        )}
      >
        {children}
        {aoAdicionar && (
          <button
            type="button"
            onClick={aoAdicionar}
            aria-label={`Nova oportunidade em ${etapa.nome}`}
            className="grid h-8 shrink-0 place-items-center rounded-lg border border-dashed border-borda-forte text-texto-3 transition-colors hover:border-brand-700 hover:text-brand-700"
          >
            <Plus aria-hidden className="size-4" />
          </button>
        )}
      </div>
    </section>
  )
}
