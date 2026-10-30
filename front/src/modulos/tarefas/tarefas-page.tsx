import { useEffect, useState } from 'react'
import { CircleCheck, ListTodo, Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { Badge, EmptyState, FilterBar, PageHeader, Pagination, Select, Spinner, cx } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { TarefaDto } from '@/model/atividade'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { separarErros } from '@/lib/erros'
import { dataHora } from '@/lib/formato'
import { BotaoIcone } from '../oportunidades/components/abas-da-oportunidade'
import { TarefaModal } from '../oportunidades/components/tarefa-modal'
import { TIPOS_DE_ATIVIDADE } from '../oportunidades/oportunidades.types'
import { useConcluirTarefa } from '../oportunidades/use-atividades'
import { useTitulosDasOportunidades } from '../oportunidades/use-oportunidades'
import { SITUACAO_INICIAL, SITUACOES, type TSituacaoTarefas } from './tarefas.types'
import { TAMANHO_DA_PAGINA, useMinhasTarefas } from './use-tarefas'

const CABECALHO = 'px-3 py-3 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-texto-3 uppercase'
const CELULA = 'px-3 py-3 whitespace-nowrap'

/**
 * Minhas tarefas, de todas as oportunidades (GET /tarefas), as mais urgentes primeiro. Todas são
 * do próprio usuário, que as edita e conclui só com crm.oportunidade.ver; repassar a outra
 * pessoa exige crm.oportunidade.editar.
 */
export function TarefasPage() {
  const [situacao, setSituacao] = useState<TSituacaoTarefas>(SITUACAO_INICIAL)
  const [pagina, setPagina] = useState(0)
  const [editando, setEditando] = useState<TarefaDto | null>(null)

  const { tem } = usePermissoes()
  const consulta = useMinhasTarefas(situacao, pagina)
  const tarefas = consulta.data?.itens ?? []
  const total = consulta.data?.total
  const tituloDa = useTitulosDasOportunidades(tarefas.map((t) => t.oportunidadeId))
  const concluir = useConcluirTarefa()

  // Concluída a última tarefa da página, volta uma página em vez de mostrar a lista vazia
  const paginaVazia = consulta.isSuccess && !consulta.isPlaceholderData && tarefas.length === 0 && pagina > 0
  useEffect(() => {
    if (paginaVazia) setPagina((atual) => atual - 1)
  }, [paginaVazia])

  function filtrar(nova: TSituacaoTarefas) {
    setSituacao(nova)
    setPagina(0)
    concluir.reset()
  }

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle={consulta.isError ? 'Não foi possível carregar' : total === undefined ? 'Carregando…' : `${total} ${total === 1 ? 'tarefa' : 'tarefas'} sob sua responsabilidade`}
      />

      <FilterBar>
        <Select aria-label="Situação" className="w-40" value={situacao} onChange={(e) => filtrar(e.target.value as TSituacaoTarefas)}>
          {Object.entries(SITUACOES).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </Select>
      </FilterBar>

      <section aria-live="polite" className="flex-1 p-5">
        {concluir.error != null && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{separarErros(concluir.error, []).geral}</p>}
        {consulta.isPending && <Spinner />}
        {consulta.isError && <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
        {consulta.isSuccess && tarefas.length === 0 && !paginaVazia && (
          <EmptyState icon={<ListTodo aria-hidden />} title={SITUACOES[situacao].vazio}>
            Aparecem aqui as tarefas de que você é responsável, em todas as oportunidades.
          </EmptyState>
        )}
        {tarefas.length > 0 && (
          <>
            <div className="relative overflow-x-auto rounded-xl border border-borda bg-superficie shadow-sm">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-borda">
                  <tr>
                    <th scope="col" className={CABECALHO}>Tarefa</th>
                    <th scope="col" className={CABECALHO}>Oportunidade</th>
                    <th scope="col" className={CABECALHO}>Vencimento</th>
                    <th scope="col" className={CABECALHO}>Situação</th>
                    <th scope="col" className={CABECALHO}><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {tarefas.map((t) => {
                    const pendente = t.status === 'pendente'
                    return (
                      <tr key={t.id}>
                        <td className={`${CELULA} max-w-80`}>
                          <p className={cx('truncate font-semibold', pendente ? 'text-titulo' : 'text-texto-3 line-through')}>{t.descricao}</p>
                          {t.tipo && TIPOS_DE_ATIVIDADE[t.tipo] && <p className="text-xs text-texto-3">{TIPOS_DE_ATIVIDADE[t.tipo]}</p>}
                        </td>
                        <td className={`${CELULA} max-w-64`}>
                          {t.oportunidadeId
                            ? <Link to={`/oportunidades/${t.oportunidadeId}`} className="block truncate text-brand-700 hover:underline dark:text-brand-400">{tituloDa(t.oportunidadeId) ?? 'Abrir oportunidade'}</Link>
                            : <span className="text-texto-3">Sem oportunidade</span>}
                        </td>
                        <td className={cx(CELULA, t.vencida ? 'font-semibold text-red-600 dark:text-red-400' : 'text-texto-2')}>
                          {dataHora(t.dataVencimento) ?? <span className="text-texto-3">Sem data</span>}
                        </td>
                        <td className={CELULA}>
                          {t.vencida ? <Badge variant="red">vencida</Badge> : pendente ? <Badge variant="indigo">pendente</Badge> : <Badge variant="green">concluída</Badge>}
                          {!pendente && <p className="mt-0.5 text-xs text-texto-3">{dataHora(t.concluidaEm)}</p>}
                        </td>
                        <td className={`${CELULA} text-right`}>
                          {pendente && (
                            <div className="-my-1 flex justify-end">
                              <BotaoIcone icone={CircleCheck} rotulo="Concluir tarefa" desabilitado={concluir.isPending} onClick={() => concluir.mutate(t.id)} />
                              <BotaoIcone icone={Pencil} rotulo="Editar tarefa" onClick={() => setEditando(t)} />
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagina={pagina} tamanho={TAMANHO_DA_PAGINA} total={total ?? 0} onChange={setPagina} />
          </>
        )}
      </section>

      {editando && (
        <TarefaModal key={editando.id} oportunidadeId={editando.oportunidadeId} tarefa={editando}
          podeRepassar={tem(PERMISSOES.oportunidadeEditar)} aoFechar={() => setEditando(null)} />
      )}
    </>
  )
}
