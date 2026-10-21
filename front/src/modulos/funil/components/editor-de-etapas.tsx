import { ArrowDown, ArrowUp, Check, Plus, X } from 'lucide-react'
import { Button, Input, cx } from '@/components/ui'
import { CORES_DE_ETAPA, COR_PADRAO, type TEtapaEditavel } from '../funil.types'

let sequencia = 0
const novaChave = () => `nova-${++sequencia}`

/** Lista inicial de um funil novo: uma etapa, que é o mínimo que o back-end aceita. */
export const etapasIniciais = (): TEtapaEditavel[] => [{ chave: novaChave(), nome: 'Primeira etapa', cor: COR_PADRAO }]

interface Props {
  etapas: TEtapaEditavel[]
  aoMudar: (etapas: TEtapaEditavel[]) => void
  /** Marca em vermelho as etapas sem nome, depois de uma tentativa de salvar. */
  destacarSemNome: boolean
}

/** Nome, cor e ordem das etapas, usado em Gerenciar Etapas e em Novo funil. Sempre fica ao menos uma. */
export function EditorDeEtapas({ etapas, aoMudar, destacarSemNome }: Props) {
  const alterar = (chave: string, mudanca: Partial<TEtapaEditavel>) =>
    aoMudar(etapas.map((e) => (e.chave === chave ? { ...e, ...mudanca } : e)))

  function mover(indice: number, direcao: -1 | 1) {
    const copia = [...etapas]
    ;[copia[indice], copia[indice + direcao]] = [copia[indice + direcao], copia[indice]]
    aoMudar(copia)
  }

  return (
    <>
      <ol className="space-y-2">
        {etapas.map((etapa, indice) => (
          <li key={etapa.chave} className="flex flex-wrap items-center gap-3 rounded-lg border border-borda bg-superficie-2 px-3 py-2">
            <div className="flex flex-col">
              <button type="button" aria-label={`Subir ${etapa.nome || 'etapa'}`} disabled={indice === 0} onClick={() => mover(indice, -1)}
                className="rounded-lg p-0.5 text-texto-3 hover:text-titulo disabled:opacity-30"><ArrowUp aria-hidden className="size-3.5" /></button>
              <button type="button" aria-label={`Descer ${etapa.nome || 'etapa'}`} disabled={indice === etapas.length - 1} onClick={() => mover(indice, 1)}
                className="rounded-lg p-0.5 text-texto-3 hover:text-titulo disabled:opacity-30"><ArrowDown aria-hidden className="size-3.5" /></button>
            </div>

            <div role="radiogroup" aria-label={`Cor de ${etapa.nome || 'etapa'}`} className="flex flex-wrap gap-1">
              {CORES_DE_ETAPA.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  role="radio"
                  aria-checked={etapa.cor === cor}
                  aria-label={cor}
                  onClick={() => alterar(etapa.chave, { cor })}
                  className={cx('grid size-5 place-items-center rounded-full text-white ring-offset-2 ring-offset-superficie-2', etapa.cor === cor && 'ring-2 ring-titulo')}
                  // A cor é dado da etapa (#RRGGBB), não tema
                  style={{ backgroundColor: cor }}
                >
                  {etapa.cor === cor && <Check aria-hidden className="size-3" />}
                </button>
              ))}
            </div>

            <Input aria-label="Nome da etapa" className="min-w-40 flex-1" value={etapa.nome} maxLength={100} invalid={destacarSemNome && !etapa.nome.trim()}
              placeholder="Nome da etapa" onChange={(e) => alterar(etapa.chave, { nome: e.target.value })} />

            {/* O funil precisa de ao menos uma etapa (409 ULTIMA_ETAPA) */}
            <button type="button" aria-label={`Remover ${etapa.nome || 'etapa'}`} disabled={etapas.length === 1}
              onClick={() => aoMudar(etapas.filter((e) => e.chave !== etapa.chave))}
              className="rounded-lg p-1.5 text-texto-3 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-500/10 dark:hover:text-red-400">
              <X aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ol>

      <Button variant="secondary" size="sm" className="mt-3" onClick={() => aoMudar([...etapas, { chave: novaChave(), nome: 'Nova Etapa', cor: COR_PADRAO }])}>
        <Plus aria-hidden className="size-3.5" /> Etapa
      </Button>
    </>
  )
}
