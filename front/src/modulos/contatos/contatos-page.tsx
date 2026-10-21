import { useState } from 'react'
import { Building2, Plus, UsersRound } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Button, EmptyState, FilterBar, PageHeader, Pagination, Spinner } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import { ViewToggle, useVisao } from '@/components/view-toggle'
import type { ContatoDto } from '@/model/contato'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { SeletorDeEmpresa } from '../empresas/components/seletor-de-empresa'
import { useResumoDeEmpresas } from '../empresas/use-empresas'
import { CardsContatos } from './components/cards-contatos'
import { ContatoDetalhe } from './components/contato-detalhe'
import { ContatoFormModal } from './components/contato-form-modal'
import { TabelaContatos } from './components/tabela-contatos'
import { TAMANHO_DA_PAGINA, useContatos } from './use-contatos'

type TFormulario = { contato?: ContatoDto } | null

/**
 * Telas 5 e 6: contatos de uma empresa, em tabela ou cartões. O back-end lista contatos por
 * empresa (GET /empresas/{id}/contatos); a empresa escolhida fica na URL (?empresa=), para
 * recarregar e voltar reabrirem a mesma lista. /contatos/{id} abre o detalhe por cima.
 */
export function ContatosPage() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [parametros, setParametros] = useSearchParams()
  const [pagina, setPagina] = useState(0)
  const [visao, setVisao] = useVisao('contatos')
  const [formulario, setFormulario] = useState<TFormulario>(null)
  const { tem } = usePermissoes()

  const empresaId = parametros.get('empresa') ?? ''
  const nomeDaEmpresaEscolhida = useResumoDeEmpresas(empresaId ? [empresaId] : [])
  const consulta = useContatos(empresaId, pagina)
  const contatos = consulta.data?.itens ?? []
  const total = consulta.data?.total
  const nomeDaEmpresa = nomeDaEmpresaEscolhida(empresaId)

  function escolherEmpresa(novaEmpresa: string) {
    setPagina(0)
    setParametros(novaEmpresa ? { empresa: novaEmpresa } : {})
  }

  // A lista leva junto a empresa escolhida, para o fechar do detalhe voltar à mesma lista
  const sufixo = empresaId ? `?empresa=${empresaId}` : ''
  const abrir = (contatoId: string) => navegar(`/contatos/${contatoId}${sufixo}`)

  return (
    <>
      <PageHeader
        title="Contatos"
        subtitle={!empresaId ? 'Escolha uma empresa' : consulta.isError ? 'Não foi possível carregar' : total === undefined ? 'Carregando…'
          : `${total} ${total === 1 ? 'contato' : 'contatos'}${nomeDaEmpresa ? ` em ${nomeDaEmpresa}` : ''}`}
        actions={tem(PERMISSOES.contatoCriar)
          ? <Button onClick={() => setFormulario({})}><Plus aria-hidden className="size-4" /> Novo Contato</Button>
          : undefined}
      />

      <FilterBar>
        <SeletorDeEmpresa aria-label="Empresa" className="w-80 max-w-full" valor={empresaId} vazio="Escolha a empresa" aoMudar={escolherEmpresa} />
        <span className="flex-1" />
        <ViewToggle value={visao} onChange={setVisao} />
      </FilterBar>

      <section aria-live="polite" className="flex-1 p-5">
        {!empresaId && (
          <EmptyState icon={<Building2 aria-hidden />} title="Escolha uma empresa">
            Os contatos são listados por empresa: escolha uma acima.
          </EmptyState>
        )}
        {empresaId && consulta.isPending && <Spinner />}
        {consulta.isError && <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
        {consulta.isSuccess && contatos.length === 0 && (
          <EmptyState icon={<UsersRound aria-hidden />} title="Nenhum contato nesta empresa"
            action={tem(PERMISSOES.contatoCriar)
              ? <Button onClick={() => setFormulario({})}><Plus aria-hidden className="size-4" /> Novo Contato</Button>
              : undefined} />
        )}
        {empresaId && contatos.length > 0 && (
          <>
            {visao === 'lista'
              ? <TabelaContatos contatos={contatos} aoAbrir={abrir} />
              : <CardsContatos contatos={contatos} aoAbrir={abrir} />}
            <Pagination pagina={pagina} tamanho={TAMANHO_DA_PAGINA} total={total ?? 0} onChange={setPagina} />
          </>
        )}
      </section>

      {id && (
        <ContatoDetalhe key={id} id={id} aoFechar={() => navegar(`/contatos${sufixo}`)}
          aoEditar={tem(PERMISSOES.contatoEditar) ? (contato) => setFormulario({ contato }) : undefined} />
      )}
      {formulario && (
        <ContatoFormModal
          key={formulario.contato?.id ?? 'novo'}
          contato={formulario.contato}
          empresaId={formulario.contato ? undefined : empresaId || undefined}
          aoFechar={() => setFormulario(null)}
          aoSalvar={(salvo) => {
            if (formulario.contato) return
            // O contato novo pode ser de outra empresa: a lista passa a ser a dela
            navegar(`/contatos/${salvo.id}?empresa=${salvo.empresaId}`)
          }}
          aoAbrirExistente={(existente) => {
            setFormulario(null)
            abrir(existente)
          }}
        />
      )}
    </>
  )
}
