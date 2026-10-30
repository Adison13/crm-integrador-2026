import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { cx } from '@/components/ui'

export type TVisao = 'lista' | 'cards'

/** A visão escolhida em cada tela, lembrada neste navegador. */
export function useVisao(tela: string) {
  const chave = `crm:visao:${tela}`
  const [visao, setVisao] = useState<TVisao>(() => {
    try {
      return window.localStorage.getItem(chave) === 'cards' ? 'cards' : 'lista'
    } catch {
      return 'lista'
    }
  })
  function trocar(nova: TVisao) {
    setVisao(nova)
    try {
      window.localStorage.setItem(chave, nova)
    } catch {
      // sem armazenamento, vale até recarregar
    }
  }
  return [visao, trocar] as const
}

const OPCOES: { valor: TVisao; rotulo: string; icone: typeof List }[] = [
  { valor: 'lista', rotulo: 'Lista', icone: List },
  { valor: 'cards', rotulo: 'Cards', icone: LayoutGrid },
]

/** Alterna a listagem entre tabela e cartões (Telas 3 a 6 do protótipo). */
export function ViewToggle({ value, onChange }: { value: TVisao; onChange: (visao: TVisao) => void }) {
  return (
    <div role="group" aria-label="Visualização" className="flex shrink-0 rounded-lg border border-borda bg-superficie p-0.5">
      {OPCOES.map(({ valor, rotulo, icone: Icone }) => (
        <button
          key={valor}
          type="button"
          aria-pressed={value === valor}
          onClick={() => onChange(valor)}
          className={cx(
            'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
            value === valor ? 'bg-brand-950 text-white dark:bg-brand-700' : 'text-texto-2 hover:bg-superficie-2 hover:text-texto',
          )}
        >
          <Icone aria-hidden className="size-3.5" />
          {rotulo}
        </button>
      ))}
    </div>
  )
}
