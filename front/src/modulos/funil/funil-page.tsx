import { useState } from 'react'
import { Pencil, Plus, Settings2, Target } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button, EmptyState, PageHeader, Spinner, cx } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { FunilDto } from '@/model/funil'
import type { OportunidadeDto } from '@/model/oportunidade'
import { useUsuarios } from '@/hooks/use-usuarios'
import { moedaCurta } from '@/lib/formato'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { useResumoDeEmpresas } from '../empresas/use-empresas'
import { OportunidadeDetalhe } from '../oportunidades/components/oportunidade-detalhe'
import { OportunidadeFormModal } from '../oportunidades/components/oportunidade-form-modal'
import { useMoverOportunidade, useOportunidadesDoFunil } from '../oportunidades/use-oportunidades'
import { CartaoOportunidade } from './components/cartao-oportunidade'
import { ColunaEtapa } from './components/coluna-etapa'
import { FunilModal } from './components/funil-modal'
import { GerenciarEtapasModal } from './components/gerenciar-etapas-modal'
import { COR_PADRAO } from './funil.types'
import { useFunis } from './use-funil'

type TFormulario = { oportunidade?: OportunidadeDto; etapaId?: string } | null

const soma = (itens: OportunidadeDto[], campo: 'valorImplantacao' | 'valorMrr') => itens.reduce((total, o) => total + (o[campo] ?? 0), 0)

/**
 * Tela 7: quadro das oportunidades abertas de um funil, por etapa. Arrastar o cartão para outra
 * coluna chama POST /oportunidades/{id}/mover. Funil e oportunidade aberta ficam na URL
 * (?funil=&oportunidade=), para recarregar e voltar reabrirem a mesma tela.
 */
export function FunilPage() {
  const [parametros, setParametros] = useSearchParams()
  const [formulario, setFormulario] = useState<TFormulario>(null)
  const [gerenciando, setGerenciando] = useState(false)
  const [editandoFunil, setEditandoFunil] = useState<{ funil?: FunilDto } | null>(null)

  const funis = useFunis()
  const funil = funis.data?.find((f) => f.id === parametros.get('funil')) ?? funis.data?.find((f) => f.padrao) ?? funis.data?.[0]
  const consulta = useOportunidadesDoFunil(funil?.id)
  const mover = useMoverOportunidade()
  const { nome } = useUsuarios()
  const { tem } = usePermissoes()
  const podeCriar = tem(PERMISSOES.oportunidadeCriar)
  const podeMover = tem(PERMISSOES.oportunidadeEditar)
  const podeAdministrar = tem(PERMISSOES.funilAdministrar)

  const oportunidades = consulta.data ?? []
  const nomeDaEmpresa = useResumoDeEmpresas(oportunidades.map((o) => o.empresaId))
  const aberta = parametros.get('oportunidade')

  function trocarParametro(chave: string, valor: string | null) {
    setParametros((atuais) => {
      const novos = new URLSearchParams(atuais)
      if (valor) novos.set(chave, valor)
      else novos.delete(chave)
      return novos
    })
  }

  function soltar(oportunidadeId: string, etapaId: string) {
    const oportunidade = oportunidades.find((o) => o.id === oportunidadeId)
    if (!oportunidade || oportunidade.etapaId === etapaId) return
    mover.mutate({ id: oportunidadeId, dados: { etapaId, proximoPasso: null, dataProximoPasso: null } })
  }

  const subtitulo = consulta.isError || funis.isError ? 'Não foi possível carregar' : consulta.data
    ? `${oportunidades.length} ${oportunidades.length === 1 ? 'oportunidade' : 'oportunidades'} · ${moedaCurta(soma(oportunidades, 'valorImplantacao'))} · MRR ${moedaCurta(soma(oportunidades, 'valorMrr'))}`
    : 'Carregando…'

  return (
    <>
      <PageHeader
        title="Funil de Vendas"
        subtitle={subtitulo}
        actions={
          <>
            {podeAdministrar && (
              <Button variant="secondary" disabled={!funil} onClick={() => setGerenciando(true)}><Settings2 aria-hidden className="size-4" /> Etapas</Button>
            )}
            {podeCriar && <Button onClick={() => setFormulario({})}><Plus aria-hidden className="size-4" /> Nova Oportunidade</Button>}
          </>
        }
      >
        {funis.data && funil && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pb-3">
            <div role="tablist" aria-label="Funis" className="flex flex-wrap gap-1.5">
              {funis.data.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={f.id === funil.id}
                  onClick={() => trocarParametro('funil', f.padrao ? null : f.id)}
                  className={cx(
                    'h-7 rounded-lg px-3 text-xs font-semibold transition-colors',
                    f.id === funil.id ? 'bg-brand-700 text-white' : 'border border-brand-700/50 text-brand-300 hover:bg-brand-900 hover:text-white',
                  )}
                >
                  {f.nome}
                </button>
              ))}
              {podeAdministrar && (
                <>
                  <button type="button" onClick={() => setEditandoFunil({ funil })} aria-label={`Editar ${funil.nome}`} title="Editar funil"
                    className="grid size-7 place-items-center rounded-lg text-brand-300 transition-colors hover:bg-brand-900 hover:text-white">
                    <Pencil aria-hidden className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditandoFunil({})}
                    className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-brand-300 transition-colors hover:bg-brand-900 hover:text-white">
                    <Plus aria-hidden className="size-3.5" /> Funil
                  </button>
                </>
              )}
            </div>
            <ul aria-label="Oportunidades por etapa" className="hidden flex-wrap gap-1.5 lg:flex">
              {funil.etapas.map((etapa) => (
                <li key={etapa.id} className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-brand-300">
                  <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: etapa.cor ?? COR_PADRAO }} />
                  {etapa.nome} ({oportunidades.filter((o) => o.etapaId === etapa.id).length})
                </li>
              ))}
            </ul>
          </div>
        )}
      </PageHeader>

      <section aria-live="polite" className="flex-1">
        {(funis.isPending || (funil && consulta.isPending)) && <Spinner className="py-20" />}
        {funis.isError && <FalhaAoCarregar erro={funis.error} aoTentarDeNovo={() => void funis.refetch()} />}
        {consulta.isError && <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
        {funis.isSuccess && !funil && <EmptyState icon={<Target aria-hidden />} title="Nenhum funil configurado" />}

        {funil && consulta.isSuccess && (
          <div className="flex gap-4 overflow-x-auto p-5">
            {funil.etapas.map((etapa) => {
              const daEtapa = oportunidades.filter((o) => o.etapaId === etapa.id)
              return (
                <ColunaEtapa
                  key={etapa.id}
                  etapa={etapa}
                  quantidade={daEtapa.length}
                  total={soma(daEtapa, 'valorImplantacao')}
                  aoSoltar={podeMover ? (id) => soltar(id, etapa.id) : undefined}
                  aoAdicionar={podeCriar ? () => setFormulario({ etapaId: etapa.id }) : undefined}
                >
                  {daEtapa.map((o) => (
                    <CartaoOportunidade
                      key={o.id}
                      oportunidade={o}
                      empresa={nomeDaEmpresa(o.empresaId)}
                      arrastavel={podeMover}
                      responsavel={nome(o.responsavelId)}
                      cor={etapa.cor}
                      movendo={mover.isPending && mover.variables?.id === o.id}
                      aoAbrir={() => trocarParametro('oportunidade', o.id)}
                    />
                  ))}
                </ColunaEtapa>
              )
            })}
          </div>
        )}
      </section>

      {aberta && (
        <OportunidadeDetalhe key={aberta} id={aberta} aoFechar={() => trocarParametro('oportunidade', null)}
          aoEditar={(o) => setFormulario({ oportunidade: o })} />
      )}
      {formulario && (
        <OportunidadeFormModal
          key={formulario.oportunidade?.id ?? `nova-${formulario.etapaId ?? ''}`}
          oportunidade={formulario.oportunidade}
          inicial={formulario.etapaId ? { etapaId: formulario.etapaId } : undefined}
          aoFechar={() => setFormulario(null)}
        />
      )}
      {gerenciando && funil && <GerenciarEtapasModal funil={funil} aoFechar={() => setGerenciando(false)} />}
      {editandoFunil && (
        <FunilModal
          key={editandoFunil.funil?.id ?? 'novo'}
          funil={editandoFunil.funil}
          aoFechar={() => setEditandoFunil(null)}
          aoCriar={(criado) => trocarParametro('funil', criado.id)}
          aoExcluir={() => trocarParametro('funil', null)}
        />
      )}
    </>
  )
}
