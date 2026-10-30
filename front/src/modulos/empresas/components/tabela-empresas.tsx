import { Avatar, statusBadge } from '@/components/ui'
import type { EmpresaDto } from '@/model/empresa'
import type { StatusExternos } from '@/model/externos'
import { cnpj, local } from '@/lib/formato'
import { STATUS_COMERCIAL } from '../empresas.types'
import { StatusExterno } from './status-externo'

interface Props {
  empresas: EmpresaDto[]
  status: Record<string, StatusExternos> | undefined
  carregandoStatus: boolean
  nomeDoVendedor: (id: string | null) => string | null
  aoAbrir: (id: string) => void
}

const CABECALHO = 'px-3 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-texto-3 uppercase'
const CELULA = 'px-3 py-3 whitespace-nowrap'

/** Tela 3: empresas em tabela, com os quatro status lado a lado (§10.4). */
export function TabelaEmpresas({ empresas, status, carregandoStatus, nomeDoVendedor, aoAbrir }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-superficie shadow-sm">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="border-b border-borda">
          <tr>
            <th scope="col" className={CABECALHO}>Empresa</th>
            <th scope="col" className={CABECALHO}>CNPJ</th>
            <th scope="col" className={CABECALHO}>Segmento</th>
            <th scope="col" className={CABECALHO}>Comercial</th>
            <th scope="col" className={CABECALHO}>Financeiro</th>
            <th scope="col" className={CABECALHO}>Contratual</th>
            <th scope="col" className={CABECALHO}>Técnico</th>
            <th scope="col" className={CABECALHO}>Vendedor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borda">
          {empresas.map((empresa) => {
            const externos = status?.[empresa.id]
            return (
              <tr key={empresa.id} onClick={() => aoAbrir(empresa.id)} className="cursor-pointer transition-colors hover:bg-superficie-2">
                <td className={CELULA}>
                  <div className="flex items-center gap-3">
                    <Avatar nome={empresa.razaoSocial} size="sm" />
                    <div className="min-w-0">
                      {/* O botão leva o foco do teclado; o clique na linha inteira é atalho do mouse */}
                      <button type="button" onClick={(e) => { e.stopPropagation(); aoAbrir(empresa.id) }} className="block max-w-64 truncate text-left font-semibold text-titulo hover:underline">
                        {empresa.razaoSocial}
                      </button>
                      <p className="text-xs text-texto-3">{local(empresa.cidade, empresa.estado) ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className={`${CELULA} font-mono text-xs text-texto-2`}>{cnpj(empresa.cnpj) ?? '—'}</td>
                <td className={`${CELULA} text-texto-2`}>{empresa.segmento ?? '—'}</td>
                <td className={CELULA}>{statusBadge(STATUS_COMERCIAL[empresa.statusComercial])}</td>
                <td className={CELULA}><StatusExterno dono="Financeiro" valor={externos?.financeiro} carregando={carregandoStatus} /></td>
                <td className={CELULA}><StatusExterno dono="Contratos" valor={externos?.contratual} carregando={carregandoStatus} /></td>
                <td className={CELULA}><StatusExterno dono="Chamados" valor={externos?.tecnico} carregando={carregandoStatus} /></td>
                <td className={`${CELULA} text-texto-2`}>{nomeDoVendedor(empresa.vendedorResponsavel) ?? <span className="text-texto-3">Sem vendedor</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
