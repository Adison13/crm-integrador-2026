import { useState } from 'react'
import { ArrowRightLeft, PhoneCall, Radar, SearchX } from 'lucide-react'
import { Avatar, Badge, Button, EmptyState, FilterBar, Input, PageHeader, Pagination, Select, Spinner, statusBadge } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { ItemProspeccao } from '@/model/prospeccao'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { useAtraso } from '@/hooks/use-atraso'
import { useUsuarios } from '@/hooks/use-usuarios'
import { haQuanto, local } from '@/lib/formato'
import { PORTES, SEGMENTOS, STATUS_COMERCIAL } from '../empresas/empresas.types'
import { ConverterModal } from './components/converter-modal'
import { HistoricoModal } from './components/historico-modal'
import { IconeDoCanal } from './components/canal'
import { TentativaModal } from './components/tentativa-modal'
import { FILTRO_INICIAL, RESULTADOS, type TFiltroProspeccao } from './prospeccao.types'
import { TAMANHO_DA_PAGINA, useProspeccao } from './use-prospeccao'

type TAcao = { tipo: 'historico' | 'tentativa' | 'converter'; empresa: ItemProspeccao } | null

const CABECALHO = 'px-3 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-texto-3 uppercase'
const CELULA = 'px-3 py-3 whitespace-nowrap'

/** Empresas em lead ou prospect, com as tentativas de contato e a conversão em oportunidade (RF-CRM-08 e 09). */
export function ProspeccaoPage() {
  const [filtro, setFiltro] = useState<TFiltroProspeccao>(FILTRO_INICIAL)
  const [pagina, setPagina] = useState(0)
  const [acao, setAcao] = useState<TAcao>(null)

  const cidade = useAtraso(filtro.cidade)
  const consulta = useProspeccao({ ...filtro, cidade }, pagina)
  const itens = consulta.data?.itens ?? []
  const { usuarios, nome } = useUsuarios()
  const { tem } = usePermissoes()
  // crm.prospeccao.registrar ainda não está em permissoes/crm.yaml do infra: sem ela, o botão some
  const podeRegistrar = tem(PERMISSOES.prospeccaoRegistrar)
  const podeConverter = tem(PERMISSOES.oportunidadeCriar)

  const filtrando = Object.values(filtro).some(Boolean)
  const total = consulta.data?.total

  function filtrar<K extends keyof TFiltroProspeccao>(campo: K, valor: TFiltroProspeccao[K]) {
    setFiltro((atual) => ({ ...atual, [campo]: valor }))
    setPagina(0)
  }

  return (
    <>
      <PageHeader
        title="Prospecção"
        subtitle={consulta.isError ? 'Não foi possível carregar' : total === undefined ? 'Carregando…' : `${total} ${total === 1 ? 'empresa em prospecção' : 'empresas em prospecção'}`}
      />

      <FilterBar>
        <Select aria-label="Status" className="w-32" value={filtro.status} onChange={(e) => filtrar('status', e.target.value as TFiltroProspeccao['status'])}>
          <option value="">Status</option>
          <option value="lead">{STATUS_COMERCIAL.lead}</option>
          <option value="prospect">{STATUS_COMERCIAL.prospect}</option>
        </Select>
        <Select aria-label="Segmento" className="w-44" value={filtro.segmento} onChange={(e) => filtrar('segmento', e.target.value)}>
          <option value="">Segmento</option>
          {SEGMENTOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select aria-label="Porte" className="w-32" value={filtro.porte} onChange={(e) => filtrar('porte', e.target.value)}>
          <option value="">Porte</option>
          {PORTES.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Input aria-label="Cidade" className="w-40" placeholder="Cidade (nome completo)" value={filtro.cidade} onChange={(e) => filtrar('cidade', e.target.value)} />
        <Select aria-label="Vendedor" className="w-40" value={filtro.vendedorId} onChange={(e) => filtrar('vendedorId', e.target.value)}>
          <option value="">Vendedor</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </Select>
      </FilterBar>

      <section aria-live="polite" className="flex-1 p-5">
        {consulta.isPending && <Spinner />}
        {consulta.isError && <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
        {consulta.isSuccess && itens.length === 0 && (
          filtrando
            ? <EmptyState icon={<SearchX aria-hidden />} title="Nenhuma empresa com esses filtros"
                action={<Button variant="outline" onClick={() => { setFiltro(FILTRO_INICIAL); setPagina(0) }}>Limpar filtros</Button>} />
            : <EmptyState icon={<Radar aria-hidden />} title="Nenhuma empresa em prospecção">
                Empresas em lead ou prospect aparecem aqui.
              </EmptyState>
        )}
        {itens.length > 0 && (
          <>
            <div className="relative overflow-x-auto rounded-xl border border-borda bg-superficie shadow-sm">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="border-b border-borda">
                  <tr>
                    <th scope="col" className={CABECALHO}>Empresa</th>
                    <th scope="col" className={CABECALHO}>Segmento · Porte</th>
                    <th scope="col" className={CABECALHO}>Status</th>
                    <th scope="col" className={CABECALHO}>Vendedor</th>
                    <th scope="col" className={CABECALHO}>Tentativas</th>
                    <th scope="col" className={CABECALHO}>Última tentativa</th>
                    <th scope="col" className={CABECALHO}><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {itens.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-superficie-2">
                      <td className={CELULA}>
                        <div className="flex items-center gap-3">
                          <Avatar nome={item.razaoSocial} size="sm" />
                          <div className="min-w-0">
                            <p className="max-w-64 truncate font-semibold text-titulo">{item.razaoSocial}</p>
                            <p className="text-xs text-texto-3">{local(item.cidade, item.estado) ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${CELULA} text-texto-2`}>{[item.segmento, item.porte].filter(Boolean).join(' · ') || '—'}</td>
                      <td className={CELULA}>{statusBadge(STATUS_COMERCIAL[item.statusComercial])}</td>
                      <td className={`${CELULA} text-texto-2`}>{nome(item.vendedorResponsavel) ?? <span className="text-texto-3">Sem vendedor</span>}</td>
                      <td className={CELULA}>
                        <button type="button" onClick={() => setAcao({ tipo: 'historico', empresa: item })}
                          className="font-semibold text-brand-700 hover:underline dark:text-brand-400" aria-label={`Ver as ${item.totalTentativas} tentativas com ${item.razaoSocial}`}>
                          {item.totalTentativas}
                        </button>
                      </td>
                      <td className={CELULA}>
                        {item.ultimaTentativa ? (
                          <div className="flex items-center gap-2">
                            <IconeDoCanal canal={item.ultimaTentativa.canal} />
                            <Badge variant={RESULTADOS[item.ultimaTentativa.resultado].cor}>{RESULTADOS[item.ultimaTentativa.resultado].rotulo}</Badge>
                            <span className="text-xs text-texto-3">{haQuanto(item.ultimaTentativa.realizadaEm)}</span>
                          </div>
                        ) : <span className="text-xs text-texto-3">Nunca contatada</span>}
                      </td>
                      <td className={`${CELULA} text-right`}>
                        <div className="flex justify-end gap-1.5">
                          {podeRegistrar && (
                            <Button variant="ghost" size="sm" title="Registrar tentativa de contato"
                              aria-label={`Registrar tentativa de contato com ${item.razaoSocial}`} onClick={() => setAcao({ tipo: 'tentativa', empresa: item })}>
                              <PhoneCall aria-hidden className="size-4" />
                            </Button>
                          )}
                          {podeConverter && (
                            <Button variant="secondary" size="sm" onClick={() => setAcao({ tipo: 'converter', empresa: item })}>
                              <ArrowRightLeft aria-hidden className="size-3.5" /> Converter
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagina={pagina} tamanho={TAMANHO_DA_PAGINA} total={total ?? 0} onChange={setPagina} />
          </>
        )}
      </section>

      {acao?.tipo === 'historico' && (
        <HistoricoModal empresa={acao.empresa} aoFechar={() => setAcao(null)}
          aoRegistrar={podeRegistrar ? () => setAcao({ tipo: 'tentativa', empresa: acao.empresa }) : undefined} />
      )}
      {acao?.tipo === 'tentativa' && <TentativaModal empresa={acao.empresa} aoFechar={() => setAcao(null)} />}
      {acao?.tipo === 'converter' && <ConverterModal empresa={acao.empresa} aoFechar={() => setAcao(null)} />}
    </>
  )
}
