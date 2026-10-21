import { Avatar, Badge, cx } from '@/components/ui'
import type { ContatoDto } from '@/model/contato'
import { telefone } from '@/lib/formato'
import { PAPEIS } from '../contatos.types'
import { IconePreferencia, SeloLgpd } from './canais'

interface Props {
  contatos: ContatoDto[]
  aoAbrir: (id: string) => void
}

const CABECALHO = 'px-3 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-texto-3 uppercase'
const CELULA = 'px-3 py-3 whitespace-nowrap'

/** Tela 5: contatos em tabela. Consentimento revogado esmaece a linha. */
export function TabelaContatos({ contatos, aoAbrir }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-superficie shadow-sm">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="border-b border-borda">
          <tr>
            <th scope="col" className={CABECALHO}>Contato</th>
            <th scope="col" className={CABECALHO}>Cargo</th>
            <th scope="col" className={CABECALHO}>Papel</th>
            <th scope="col" className={CABECALHO}>E-mail</th>
            <th scope="col" className={CABECALHO}>Telefone</th>
            <th scope="col" className={cx(CABECALHO, 'text-center')}>LGPD</th>
            <th scope="col" className={cx(CABECALHO, 'text-center')}>Pref.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borda">
          {contatos.map((c) => (
            <tr key={c.id} onClick={() => aoAbrir(c.id)}
              className={cx('cursor-pointer transition-colors hover:bg-superficie-2', c.consentimentoLgpd === 'revogado' && 'opacity-60')}>
              <td className={CELULA}>
                <div className="flex items-center gap-3">
                  <Avatar nome={c.nome} size="sm" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); aoAbrir(c.id) }} className="text-left font-semibold text-titulo hover:underline">
                    {c.nome}
                  </button>
                </div>
              </td>
              <td className={`${CELULA} text-texto-2`}>{c.cargo ?? '—'}</td>
              <td className={CELULA}>{c.papel ? <Badge variant={PAPEIS[c.papel].cor}>{PAPEIS[c.papel].rotulo}</Badge> : <span className="text-texto-3">—</span>}</td>
              <td className={`${CELULA} max-w-56 truncate text-texto-2`} title={c.email ?? undefined}>{c.email ?? '—'}</td>
              <td className={`${CELULA} text-texto-2`}>{telefone(c.telefone) ?? '—'}</td>
              <td className={`${CELULA} text-center`}><SeloLgpd consentimento={c.consentimentoLgpd} /></td>
              <td className={`${CELULA} text-center`}><IconePreferencia preferencia={c.preferenciaComunicacao} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
