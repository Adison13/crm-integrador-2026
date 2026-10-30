import { Avatar, Badge, cx } from '@/components/ui'
import type { ContatoDto } from '@/model/contato'
import { PAPEIS } from '../contatos.types'
import { IconePreferencia, SeloLgpd } from './canais'

interface Props {
  contatos: ContatoDto[]
  aoAbrir: (id: string) => void
}

/** Tela 6: contatos em cartões — papel no topo, LGPD e canal preferido no rodapé. */
export function CardsContatos({ contatos, aoAbrir }: Props) {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {contatos.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => aoAbrir(c.id)}
            className={cx(
              'flex h-full w-full flex-col rounded-xl border border-borda bg-superficie p-4 text-left shadow-sm transition-shadow hover:shadow-md',
              c.consentimentoLgpd === 'revogado' && 'opacity-70',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <Avatar nome={c.nome} />
              {c.papel && <Badge variant={PAPEIS[c.papel].cor}>{PAPEIS[c.papel].rotulo}</Badge>}
            </div>
            <p className="mt-3 font-semibold text-titulo">{c.nome}</p>
            <p className="text-xs text-texto-2">{c.cargo ?? 'Cargo não informado'}</p>
            <p className="truncate text-xs text-texto-3">{c.email ?? 'Sem e-mail'}</p>
            <span aria-hidden className="min-h-3.5 flex-1" />
            <div className="flex items-center gap-4 border-t border-borda pt-3">
              <SeloLgpd consentimento={c.consentimentoLgpd} comRotulo />
              <IconePreferencia preferencia={c.preferenciaComunicacao} comRotulo />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
