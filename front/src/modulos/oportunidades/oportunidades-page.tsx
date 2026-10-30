import { useState } from 'react'
import { BriefcaseBusiness, Plus, SearchX, TriangleAlert } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Badge, Button, EmptyState, FilterBar, PageHeader, Pagination, Select, Spinner, cx } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { OportunidadeDto, OrdenacaoOportunidades, StatusOportunidade } from '@/model/oportunidade'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { useUsuarios } from '@/hooks/use-usuarios'
import { dataCurta, moedaCurta } from '@/lib/formato'
import { useResumoDeEmpresas } from '../empresas/use-empresas'
import { useFunis } from '../funil/use-funil'
import { NomeDaEtapa } from './components/etapa'
import { OportunidadeDetalhe } from './components/oportunidade-detalhe'
import { OportunidadeFormModal } from './components/oportunidade-form-modal'
import { FILTRO_INICIAL, ORDENACOES, STATUS_DA_OPORTUNIDADE, type TFiltroOportunidades } from './oportunidades.types'
import { TAMANHO_DA_PAGINA, useOportunidades } from './use-oportunidades'

type TFormulario = { oportunidade?: OportunidadeDto } | null

const CABECALHO = 'px-3 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-texto-3 uppercase'
const CELULA = 'px-3 py-3 whitespace-nowrap'

/** Oportunidades em lista, com os filtros e as ordenações de GET /oportunidades. /oportunidades/{id} abre o detalhe. */
export function OportunidadesPage() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<TFiltroOportunidades>(FILTRO_INICIAL)
  const [pagina, setPagina] = useState(0)
  const [formulario, setFormulario] = useState<TFormulario>(null)

  const { tem } = usePermissoes()
  const consulta = useOportunidades(filtro, pagina)
  const oportunidades = consulta.data?.itens ?? []
  const funis = useFunis()
  const { usuarios, nome } = useUsuarios()
  const nomeDaEmpresa = useResumoDeEmpresas(oportunidades.map((o) => o.empresaId))
  const etapas = funis.data?.flatMap((f) => f.etapas) ?? []
  const funilEscolhido = funis.data?.find((f) => f.id === filtro.funilId)

  const filtrando = filtro.funilId || filtro.etapaId || filtro.responsavelId || filtro.status !== FILTRO_INICIAL.status
  const total = consulta.data?.total
  // Filtrando por um status, a coluna repetiria o mesmo valor em todas as linhas
  const mostrarStatus = filtro.status === ''

  function filtrar<K extends keyof TFiltroOportunidades>(campo: K, valor: TFiltroOportunidades[K]) {
    setFiltro((atual) => ({ ...atual, [campo]: valor, ...(campo === 'funilId' ? { etapaId: '' } : {}) }))
    setPagina(0)
  }

  const abrir = (oportunidadeId: string) => navegar(`/oportunidades/${oportunidadeId}`)

  return (
    <>
      <PageHeader
        title="Oportunidades"
        subtitle={consulta.isError ? 'Não foi possível carregar' : total === undefined ? 'Carregando…' : `${total} ${total === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}`}
        actions={tem(PERMISSOES.oportunidadeCriar)
          ? <Button onClick={() => setFormulario({})}><Plus aria-hidden className="size-4" /> Nova Oportunidade</Button>
          : undefined}
      />

      <FilterBar>
        <Select aria-label="Status" className="w-32" value={filtro.status} onChange={(e) => filtrar('status', e.target.value as StatusOportunidade | '')}>
          <option value="">Todas</option>
          {Object.entries(STATUS_DA_OPORTUNIDADE).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}s</option>)}
        </Select>
        <Select aria-label="Funil" className="w-52" value={filtro.funilId} onChange={(e) => filtrar('funilId', e.target.value)}>
          <option value="">Todos os funis</option>
          {funis.data?.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </Select>
        <Select aria-label="Etapa" className="w-44" value={filtro.etapaId} disabled={!funilEscolhido} onChange={(e) => filtrar('etapaId', e.target.value)}>
          <option value="">{funilEscolhido ? 'Todas as etapas' : 'Etapa'}</option>
          {funilEscolhido?.etapas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </Select>
        <Select aria-label="Responsável" className="w-40" value={filtro.responsavelId} onChange={(e) => filtrar('responsavelId', e.target.value)}>
          <option value="">Responsável</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </Select>
        <Select aria-label="Ordenar por" className="w-44" value={filtro.ordenar} onChange={(e) => filtrar('ordenar', e.target.value as OrdenacaoOportunidades)}>
          {Object.entries(ORDENACOES).map(([valor, rotulo]) => <option key={valor} value={valor}>Ordenar: {rotulo}</option>)}
        </Select>
      </FilterBar>

      <section aria-live="polite" className="flex-1 p-5">
        {consulta.isPending && <Spinner />}
        {consulta.isError && <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
        {consulta.isSuccess && oportunidades.length === 0 && (
          filtrando
            ? <EmptyState icon={<SearchX aria-hidden />} title="Nenhuma oportunidade com esses filtros"
                action={<Button variant="outline" onClick={() => { setFiltro(FILTRO_INICIAL); setPagina(0) }}>Limpar filtros</Button>} />
            : <EmptyState icon={<BriefcaseBusiness aria-hidden />} title="Nenhuma oportunidade aberta"
                action={tem(PERMISSOES.oportunidadeCriar)
                  ? <Button onClick={() => setFormulario({})}><Plus aria-hidden className="size-4" /> Nova Oportunidade</Button>
                  : undefined}>
                O back-end mostra as suas oportunidades, as das suas equipes e as ainda sem responsável.
              </EmptyState>
        )}
        {oportunidades.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-borda bg-superficie shadow-sm">
              <table className="w-full min-w-[1040px] text-sm">
                <thead className="border-b border-borda">
                  <tr>
                    <th scope="col" className={CABECALHO}>Oportunidade</th>
                    <th scope="col" className={CABECALHO}>Etapa</th>
                    <th scope="col" className={cx(CABECALHO, 'text-right')}>Implantação</th>
                    <th scope="col" className={cx(CABECALHO, 'text-right')}>MRR</th>
                    <th scope="col" className={cx(CABECALHO, 'text-right')}>Prob.</th>
                    <th scope="col" className={CABECALHO}>Próximo passo</th>
                    <th scope="col" className={CABECALHO}>Fechamento</th>
                    <th scope="col" className={CABECALHO}>Responsável</th>
                    {mostrarStatus && <th scope="col" className={CABECALHO}>Status</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {oportunidades.map((o) => (
                    <tr key={o.id} onClick={() => abrir(o.id)} className="cursor-pointer transition-colors hover:bg-superficie-2">
                      <td className={CELULA}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); abrir(o.id) }} className="block max-w-64 truncate text-left font-semibold text-titulo hover:underline">
                          {o.titulo}
                        </button>
                        <p className="max-w-64 truncate text-xs text-texto-3">{nomeDaEmpresa(o.empresaId) ?? '—'}</p>
                      </td>
                      <td className={`${CELULA} text-texto-2`}><NomeDaEtapa etapa={etapas.find((e) => e.id === o.etapaId)} /></td>
                      <td className={`${CELULA} text-right font-medium text-titulo`}>{moedaCurta(o.valorImplantacao) ?? '—'}</td>
                      <td className={`${CELULA} text-right text-texto-2`}>{moedaCurta(o.valorMrr) ?? '—'}</td>
                      <td className={`${CELULA} text-right text-texto-2`}>{o.probabilidade == null ? '—' : `${o.probabilidade}%`}</td>
                      <td className={`${CELULA} max-w-60`}>
                        <p className="truncate text-texto-2">{o.proximoPasso ?? '—'}</p>
                        {o.dataProximoPasso && (
                          <p className={cx('flex items-center gap-1 text-xs', o.proximoPassoAtrasado ? 'font-semibold text-red-600 dark:text-red-400' : 'text-texto-3')}>
                            {o.proximoPassoAtrasado && <TriangleAlert aria-hidden className="size-3" />}
                            {dataCurta(o.dataProximoPasso)}{o.proximoPassoAtrasado && ' · atrasado'}
                          </p>
                        )}
                      </td>
                      <td className={`${CELULA} text-texto-2`}>{dataCurta(o.dataPrevistaFechamento) ?? '—'}</td>
                      <td className={`${CELULA} text-texto-2`}>{nome(o.responsavelId) ?? <span className="text-texto-3">Sem responsável</span>}</td>
                      {mostrarStatus && <td className={CELULA}><Badge variant={STATUS_DA_OPORTUNIDADE[o.status].cor}>{STATUS_DA_OPORTUNIDADE[o.status].rotulo}</Badge></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagina={pagina} tamanho={TAMANHO_DA_PAGINA} total={total ?? 0} onChange={setPagina} />
          </>
        )}
      </section>

      {id && <OportunidadeDetalhe key={id} id={id} aoFechar={() => navegar('/oportunidades')} aoEditar={(o) => setFormulario({ oportunidade: o })} />}
      {formulario && (
        <OportunidadeFormModal
          key={formulario.oportunidade?.id ?? 'nova'}
          oportunidade={formulario.oportunidade}
          aoFechar={() => setFormulario(null)}
          aoSalvar={(salva) => !formulario.oportunidade && abrir(salva.id)}
        />
      )}
    </>
  )
}
