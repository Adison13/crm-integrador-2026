import { useState } from 'react'
import { Building2, Plus, SearchX } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Button, EmptyState, FilterBar, PageHeader, Pagination, Select, Spinner } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import { ViewToggle, useVisao } from '@/components/view-toggle'
import type { EmpresaDto, StatusComercial } from '@/model/empresa'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { useUsuarios } from '@/hooks/use-usuarios'
import { CardsEmpresas } from './components/cards-empresas'
import { EmpresaDetalhe } from './components/empresa-detalhe'
import { EmpresaFormModal } from './components/empresa-form-modal'
import { TabelaEmpresas } from './components/tabela-empresas'
import { FILTRO_INICIAL, SEGMENTOS, STATUS_COMERCIAL, type TFiltroEmpresas } from './empresas.types'
import { TAMANHO_DA_PAGINA, useEmpresas, useStatusExternos } from './use-empresas'

/** Formulário aberto: nova empresa (sem empresa) ou edição. */
type TFormulario = { empresa?: EmpresaDto } | null

/** Telas 3 e 4: empresas em tabela ou cartões. /empresas/{id} abre o detalhe por cima da lista. */
export function EmpresasPage() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<TFiltroEmpresas>(FILTRO_INICIAL)
  const [pagina, setPagina] = useState(0)
  const [visao, setVisao] = useVisao('empresas')
  const [formulario, setFormulario] = useState<TFormulario>(null)
  const { tem } = usePermissoes()
  const podeCriar = tem(PERMISSOES.empresaCriar)

  const consulta = useEmpresas(filtro, pagina)
  const empresas = consulta.data?.itens ?? []
  const status = useStatusExternos(empresas.map((e) => e.id))
  const { nome } = useUsuarios()

  const filtrando = Object.values(filtro).some(Boolean)
  const total = consulta.data?.total

  function filtrar<K extends keyof TFiltroEmpresas>(campo: K, valor: TFiltroEmpresas[K]) {
    setFiltro((atual) => ({ ...atual, [campo]: valor }))
    setPagina(0)
  }

  const abrir = (empresaId: string) => navegar(`/empresas/${empresaId}`)
  const novaEmpresa = podeCriar && <Button onClick={() => setFormulario({})}><Plus aria-hidden className="size-4" /> Nova Empresa</Button>

  return (
    <>
      <PageHeader
        title="Empresas"
        subtitle={consulta.isError ? 'Não foi possível carregar' : total === undefined ? 'Carregando…' : `${total} ${total === 1 ? 'empresa encontrada' : 'empresas encontradas'}`}
        actions={novaEmpresa || undefined}
      />

      <FilterBar>
        <Select aria-label="Segmento" className="w-56" value={filtro.segmento} onChange={(e) => filtrar('segmento', e.target.value)}>
          <option value="">Todos os segmentos</option>
          {SEGMENTOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select aria-label="Status comercial" className="w-44" value={filtro.status} onChange={(e) => filtrar('status', e.target.value as StatusComercial | '')}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_COMERCIAL).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </Select>
        <span className="flex-1" />
        <ViewToggle value={visao} onChange={setVisao} />
      </FilterBar>

      <section aria-live="polite" className="flex-1 p-5">
        {consulta.isPending && <Spinner />}
        {consulta.isError && <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
        {consulta.isSuccess && empresas.length === 0 && (
          filtrando
            ? <EmptyState icon={<SearchX aria-hidden />} title="Nenhuma empresa com esses filtros"
                action={<Button variant="outline" onClick={() => { setFiltro(FILTRO_INICIAL); setPagina(0) }}>Limpar filtros</Button>} />
            : <EmptyState icon={<Building2 aria-hidden />} title="Nenhuma empresa cadastrada" action={novaEmpresa || undefined}>
                {podeCriar ? 'Cadastre a primeira empresa do CRM.' : 'Quando houver empresas cadastradas, elas aparecem aqui.'}
              </EmptyState>
        )}
        {empresas.length > 0 && (
          <>
            {visao === 'lista'
              ? <TabelaEmpresas empresas={empresas} status={status.data} carregandoStatus={status.isPending} nomeDoVendedor={nome} aoAbrir={abrir} />
              : <CardsEmpresas empresas={empresas} status={status.data} carregandoStatus={status.isPending} nomeDoVendedor={nome} aoAbrir={abrir} />}
            <Pagination pagina={pagina} tamanho={TAMANHO_DA_PAGINA} total={total ?? 0} onChange={setPagina} />
          </>
        )}
      </section>

      {id && (
        <EmpresaDetalhe key={id} id={id} aoFechar={() => navegar('/empresas')}
          aoEditar={tem(PERMISSOES.empresaEditar) ? (empresa) => setFormulario({ empresa }) : undefined} />
      )}
      {formulario && (
        <EmpresaFormModal
          key={formulario.empresa?.id ?? 'nova'}
          empresa={formulario.empresa}
          aoFechar={() => setFormulario(null)}
          aoSalvar={(salva) => !formulario.empresa && abrir(salva.id)}
          aoAbrirExistente={(existente) => {
            setFormulario(null)
            abrir(existente)
          }}
        />
      )}
    </>
  )
}
