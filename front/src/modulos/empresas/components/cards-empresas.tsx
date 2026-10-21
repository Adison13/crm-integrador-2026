import { Avatar, Badge, statusBadge } from '@/components/ui'
import type { EmpresaDto } from '@/model/empresa'
import type { StatusExternos } from '@/model/externos'
import { local, primeiroNome } from '@/lib/formato'
import { STATUS_COMERCIAL } from '../empresas.types'
import { StatusExterno } from './status-externo'

interface Props {
  empresas: EmpresaDto[]
  status: Record<string, StatusExternos> | undefined
  carregandoStatus: boolean
  nomeDoVendedor: (id: string | null) => string | null
  aoAbrir: (id: string) => void
}

/** Tela 4: empresas em cartões, com tags de segmento, porte e UF. */
export function CardsEmpresas({ empresas, status, carregandoStatus, nomeDoVendedor, aoAbrir }: Props) {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {empresas.map((empresa) => {
        const externos = status?.[empresa.id]
        const tags = [empresa.segmento?.toLowerCase(), empresa.porte && `${empresa.porte.toLowerCase()} porte`].filter(Boolean)
        return (
          <li key={empresa.id}>
            <button
              type="button"
              onClick={() => aoAbrir(empresa.id)}
              className="flex h-full w-full flex-col rounded-xl border border-borda bg-superficie p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <Avatar nome={empresa.razaoSocial} />
                {statusBadge(STATUS_COMERCIAL[empresa.statusComercial])}
              </div>
              <p className="mt-3 font-semibold text-titulo">{empresa.razaoSocial}</p>
              <p className="text-xs text-texto-2">{[empresa.nomeFantasia, empresa.segmento].filter(Boolean).join(' · ') || '—'}</p>
              <p className="text-xs text-texto-3">{[local(empresa.cidade, empresa.estado), empresa.porte].filter(Boolean).join(' · ') || '—'}</p>
              {(tags.length > 0 || empresa.estado) && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {tags.map((tag) => <Badge key={tag} variant="indigo">{tag}</Badge>)}
                  {empresa.estado && <Badge variant="green">{empresa.estado}</Badge>}
                </div>
              )}
              <span aria-hidden className="min-h-3.5 flex-1" />
              <div className="flex items-center justify-between gap-2 border-t border-borda pt-3">
                <div className="flex flex-wrap gap-1.5">
                  <StatusExterno dono="Financeiro" valor={externos?.financeiro} carregando={carregandoStatus} />
                  <StatusExterno dono="Chamados" valor={externos?.tecnico} carregando={carregandoStatus} />
                </div>
                <span className="text-xs text-texto-3">{primeiroNome(nomeDoVendedor(empresa.vendedorResponsavel)) ?? 'Sem vendedor'}</span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
