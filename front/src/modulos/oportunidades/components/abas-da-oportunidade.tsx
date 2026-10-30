import { useId, useState, type FormEvent, type ReactNode } from 'react'
import {
  CalendarDays, CalendarPlus, CircleCheck, CircleDashed, ClipboardCheck, ListPlus, Mail, MapPin, MessageCircle,
  MessageSquareWarning, Pencil, Phone, Plus, Repeat, StickyNote, Trash2, type LucideIcon,
} from 'lucide-react'
import { Badge, Button, EmptyState, Input, Spinner, cx } from '@/components/ui'
import { ConfirmarExclusao } from '@/components/confirmar-exclusao'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { AtividadeDto, ObjecaoDto, ReuniaoDto, TarefaDto, TipoTarefa } from '@/model/atividade'
import type { OportunidadeDto } from '@/model/oportunidade'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes, useSessao } from '@/hooks/use-sessao'
import { useUsuarios } from '@/hooks/use-usuarios'
import { separarErros } from '@/lib/erros'
import { dataHora } from '@/lib/formato'
import { TIPOS_DE_ATIVIDADE } from '../oportunidades.types'
import {
  useAtividades, useCancelarReuniao, useConcluirTarefa, useExcluirAtividade, useExcluirObjecao, useExcluirTarefa,
  useObjecoes, useObjecoesFrequentes, useRegistrarObjecao, useReunioes, useTarefas,
} from '../use-atividades'
import { AtividadeModal } from './atividade-modal'
import { RegistroReuniaoModal } from './registro-reuniao-modal'
import { ReuniaoModal } from './reuniao-modal'
import { TarefaModal } from './tarefa-modal'

const ICONE_DO_TIPO: Record<TipoTarefa, LucideIcon> = {
  ligacao: Phone, email: Mail, whatsapp: MessageCircle, visita: MapPin, reuniao: CalendarDays, follow_up: Repeat, outro: StickyNote,
}

/** Gravar dentro da oportunidade exige crm.oportunidade.editar (AtividadeController, ReuniaoController). */
function usePodeEditar() {
  return usePermissoes().tem(PERMISSOES.oportunidadeEditar)
}

// ------------------------------------------------------------------ atividades

export function AbaAtividades({ oportunidade }: { oportunidade: OportunidadeDto }) {
  const atividades = useAtividades(oportunidade.id)
  const podeEditar = usePodeEditar()
  const [registrando, setRegistrando] = useState(false)
  const [excluindo, setExcluindo] = useState<AtividadeDto | null>(null)
  const excluir = useExcluirAtividade()

  return (
    <>
      {podeEditar && (
        <Barra><Button size="sm" variant="secondary" onClick={() => setRegistrando(true)}><ListPlus aria-hidden className="size-3.5" /> Registrar atividade</Button></Barra>
      )}
      <Lista consulta={atividades} itens={atividades.data?.itens} vazio="Nenhuma atividade registrada" icone={<StickyNote aria-hidden />}>
        {(a) => (
          <Item key={a.id} icone={ICONE_DO_TIPO[a.tipo]} titulo={a.descricao}
            detalhe={`${TIPOS_DE_ATIVIDADE[a.tipo]} · ${dataHora(a.realizadaEm)}`} responsavel={a.responsavelId}
            acoes={podeEditar && <BotaoIcone icone={Trash2} rotulo="Excluir atividade" perigo onClick={() => setExcluindo(a)} />} />
        )}
      </Lista>
      {registrando && <AtividadeModal oportunidadeId={oportunidade.id} aoFechar={() => setRegistrando(false)} />}
      {excluindo && (
        <ConfirmarExclusao titulo="Excluir atividade?" enviando={excluir.isPending} erro={excluir.error}
          aoConfirmar={() => excluir.mutate(excluindo.id, { onSuccess: () => setExcluindo(null) })}
          aoFechar={() => { excluir.reset(); setExcluindo(null) }}>
          “{excluindo.descricao}” sai do histórico da oportunidade.
        </ConfirmarExclusao>
      )}
    </>
  )
}

// ------------------------------------------------------------------ tarefas

export function AbaTarefas({ oportunidade }: { oportunidade: OportunidadeDto }) {
  const tarefas = useTarefas(oportunidade.id)
  const podeEditar = usePodeEditar()
  const meuId = useSessao()?.usuario.id
  const [formulario, setFormulario] = useState<{ tarefa?: TarefaDto } | null>(null)
  const [excluindo, setExcluindo] = useState<TarefaDto | null>(null)
  const concluir = useConcluirTarefa()
  const excluir = useExcluirTarefa()
  // O responsável edita e conclui a própria tarefa mesmo sem crm.oportunidade.editar
  const podeAlterar = (t: TarefaDto) => podeEditar || t.responsavelId === meuId

  return (
    <>
      {podeEditar && (
        <Barra><Button size="sm" variant="secondary" onClick={() => setFormulario({})}><Plus aria-hidden className="size-3.5" /> Nova tarefa</Button></Barra>
      )}
      {concluir.error != null && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{separarErros(concluir.error, []).geral}</p>}
      <Lista consulta={tarefas} itens={tarefas.data} vazio="Nenhuma tarefa nesta oportunidade" icone={<CircleCheck aria-hidden />}>
        {(t) => {
          const pendente = t.status === 'pendente'
          return (
            <Item
              key={t.id}
              icone={pendente ? CircleDashed : CircleCheck}
              corDoIcone={!pendente ? 'text-brand-700 dark:text-brand-400' : t.vencida ? 'text-red-600 dark:text-red-400' : undefined}
              titulo={<span className={cx(!pendente && 'text-texto-3 line-through')}>{t.descricao}</span>}
              detalhe={[t.tipo && TIPOS_DE_ATIVIDADE[t.tipo], pendente ? `Vence ${dataHora(t.dataVencimento) ?? 'sem data'}` : `Concluída ${dataHora(t.concluidaEm)}`].filter(Boolean).join(' · ')}
              selo={t.vencida ? <Badge variant="red">vencida</Badge> : pendente ? <Badge variant="indigo">pendente</Badge> : null}
              responsavel={t.responsavelId}
              acoes={
                <>
                  {pendente && podeAlterar(t) && (
                    <>
                      <BotaoIcone icone={CircleCheck} rotulo="Concluir tarefa" desabilitado={concluir.isPending} onClick={() => concluir.mutate(t.id)} />
                      <BotaoIcone icone={Pencil} rotulo="Editar tarefa" onClick={() => setFormulario({ tarefa: t })} />
                    </>
                  )}
                  {podeEditar && <BotaoIcone icone={Trash2} rotulo="Excluir tarefa" perigo onClick={() => setExcluindo(t)} />}
                </>
              }
            />
          )
        }}
      </Lista>
      {formulario && (
        <TarefaModal key={formulario.tarefa?.id ?? 'nova'} oportunidadeId={oportunidade.id} tarefa={formulario.tarefa}
          podeRepassar={podeEditar} aoFechar={() => setFormulario(null)} />
      )}
      {excluindo && (
        <ConfirmarExclusao titulo="Excluir tarefa?" enviando={excluir.isPending} erro={excluir.error}
          aoConfirmar={() => excluir.mutate(excluindo.id, { onSuccess: () => setExcluindo(null) })}
          aoFechar={() => { excluir.reset(); setExcluindo(null) }}>
          “{excluindo.descricao}” deixa de existir para todos.
        </ConfirmarExclusao>
      )}
    </>
  )
}

// ------------------------------------------------------------------ reuniões

export function AbaReunioes({ oportunidade }: { oportunidade: OportunidadeDto }) {
  const reunioes = useReunioes(oportunidade.id)
  const podeEditar = usePodeEditar()
  const [formulario, setFormulario] = useState<{ reuniao?: ReuniaoDto } | null>(null)
  const [registrando, setRegistrando] = useState<ReuniaoDto | null>(null)
  const [cancelando, setCancelando] = useState<ReuniaoDto | null>(null)
  const cancelar = useCancelarReuniao()

  return (
    <>
      {/* Oportunidade fechada não recebe reunião nova (409 OPORTUNIDADE_FECHADA) */}
      {podeEditar && oportunidade.status === 'aberta' && (
        <Barra><Button size="sm" variant="secondary" onClick={() => setFormulario({})}><CalendarPlus aria-hidden className="size-3.5" /> Agendar reunião</Button></Barra>
      )}
      <Lista consulta={reunioes} itens={reunioes.data} vazio="Nenhuma reunião agendada" icone={<CalendarDays aria-hidden />}>
        {(r) => (
          <Item
            key={r.id}
            icone={CalendarDays}
            titulo={r.pauta ?? 'Reunião sem pauta'}
            detalhe={[dataHora(r.dataHora), r.localOuLink, r.participantes].filter(Boolean).join(' · ')}
            selo={r.registrada ? <Badge variant="green">registrada</Badge> : <Badge variant="blue">agendada</Badge>}
            complemento={r.registrada && r.resumo && (
              <p className="mt-2 rounded-lg bg-superficie-2 px-3 py-2 text-xs text-texto-2">
                {r.resumo}{r.proximoPasso && <><br /><strong className="text-titulo">Próximo passo:</strong> {r.proximoPasso}</>}
              </p>
            )}
            // Registrada, a reunião não muda mais (409 REUNIAO_REGISTRADA)
            acoes={podeEditar && !r.registrada && (
              <>
                <BotaoIcone icone={ClipboardCheck} rotulo="Registrar como foi" onClick={() => setRegistrando(r)} />
                <BotaoIcone icone={Pencil} rotulo="Reagendar" onClick={() => setFormulario({ reuniao: r })} />
                <BotaoIcone icone={Trash2} rotulo="Cancelar reunião" perigo onClick={() => setCancelando(r)} />
              </>
            )}
          />
        )}
      </Lista>
      {formulario && (
        <ReuniaoModal key={formulario.reuniao?.id ?? 'nova'} oportunidadeId={oportunidade.id} reuniao={formulario.reuniao} aoFechar={() => setFormulario(null)} />
      )}
      {registrando && <RegistroReuniaoModal reuniao={registrando} aoFechar={() => setRegistrando(null)} />}
      {cancelando && (
        <ConfirmarExclusao titulo="Cancelar reunião?" confirmar="Cancelar reunião" enviando={cancelar.isPending} erro={cancelar.error}
          aoConfirmar={() => cancelar.mutate(cancelando.id, { onSuccess: () => setCancelando(null) })}
          aoFechar={() => { cancelar.reset(); setCancelando(null) }}>
          A reunião de {dataHora(cancelando.dataHora)} sai da agenda.
        </ConfirmarExclusao>
      )}
    </>
  )
}

// ------------------------------------------------------------------ objeções

export function AbaObjecoes({ oportunidade }: { oportunidade: OportunidadeDto }) {
  const objecoes = useObjecoes(oportunidade.id)
  const podeEditar = usePodeEditar()
  const [motivo, setMotivo] = useState('')
  const [excluindo, setExcluindo] = useState<ObjecaoDto | null>(null)
  const registrar = useRegistrarObjecao(oportunidade.id)
  const excluir = useExcluirObjecao()
  const frequentes = useObjecoesFrequentes()
  const sugestoes = useId()
  const erro = separarErros(registrar.error, ['motivo'])

  function adicionar(evento: FormEvent) {
    evento.preventDefault()
    if (!motivo.trim()) return
    registrar.mutate(motivo, { onSuccess: () => setMotivo('') })
  }

  return (
    <>
      {podeEditar && (
        <form onSubmit={adicionar} className="mb-3">
          <div className="flex gap-2">
            <Input aria-label="Nova objeção" list={sugestoes} value={motivo} maxLength={255} invalid={Boolean(erro.porCampo.motivo)}
              placeholder="Ex.: Preço acima do orçamento" onChange={(e) => { setMotivo(e.target.value); if (registrar.error) registrar.reset() }} />
            <Button type="submit" variant="secondary" loading={registrar.isPending} disabled={!motivo.trim()}>
              {!registrar.isPending && <Plus aria-hidden className="size-4" />} Adicionar
            </Button>
          </div>
          <datalist id={sugestoes}>{frequentes.map((m) => <option key={m} value={m} />)}</datalist>
          {(erro.porCampo.motivo ?? erro.geral) && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{erro.porCampo.motivo ?? erro.geral}</p>}
        </form>
      )}
      <Lista consulta={objecoes} itens={objecoes.data} vazio="Nenhuma objeção registrada" icone={<MessageSquareWarning aria-hidden />}>
        {(ob) => (
          <Item key={ob.id} icone={MessageSquareWarning} titulo={ob.motivo}
            detalhe={`${dataHora(ob.criadoEm)}${ob.reuniaoId ? ' · registrada em reunião' : ''}`}
            acoes={podeEditar && <BotaoIcone icone={Trash2} rotulo="Excluir objeção" perigo onClick={() => setExcluindo(ob)} />} />
        )}
      </Lista>
      {excluindo && (
        <ConfirmarExclusao titulo="Excluir objeção?" enviando={excluir.isPending} erro={excluir.error}
          aoConfirmar={() => excluir.mutate(excluindo.id, { onSuccess: () => setExcluindo(null) })}
          aoFechar={() => { excluir.reset(); setExcluindo(null) }}>
          “{excluindo.motivo}” sai desta oportunidade e da contagem das objeções frequentes.
        </ConfirmarExclusao>
      )}
    </>
  )
}

// ------------------------------------------------------------------ apoio

function Barra({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex justify-end gap-2">{children}</div>
}

/** Ação de ícone de uma linha (também em Tarefas e Agenda). */
export function BotaoIcone({ icone: Icone, rotulo, perigo, desabilitado, onClick }: {
  icone: LucideIcon; rotulo: string; perigo?: boolean; desabilitado?: boolean; onClick: () => void
}) {
  return (
    <button type="button" aria-label={rotulo} title={rotulo} disabled={desabilitado} onClick={onClick}
      className={cx('rounded-lg p-1.5 text-texto-3 transition-colors disabled:opacity-50',
        perigo ? 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400' : 'hover:bg-superficie-2 hover:text-titulo')}>
      <Icone aria-hidden className="size-4" />
    </button>
  )
}

function Lista<T>({ consulta, itens, vazio, icone, children }: {
  consulta: { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }
  itens: T[] | undefined
  vazio: string
  icone: ReactNode
  children: (item: T) => ReactNode
}) {
  if (consulta.isPending) return <Spinner />
  if (consulta.isError) return <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
  if (!itens?.length) return <EmptyState icon={icone} title={vazio} />
  return <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">{itens.map(children)}</ul>
}

function Item({ icone: Icone, corDoIcone, titulo, detalhe, selo, responsavel, complemento, acoes }: {
  icone: LucideIcon
  corDoIcone?: string
  titulo: ReactNode
  detalhe: string
  selo?: ReactNode
  responsavel?: string | null
  complemento?: ReactNode
  acoes?: ReactNode
}) {
  const { nome } = useUsuarios()
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Icone aria-hidden className={cx('mt-0.5 size-4 shrink-0', corDoIcone ?? 'text-texto-3')} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-texto">{titulo}</p>
        <p className="mt-0.5 text-xs text-texto-3">{detalhe}{responsavel && nome(responsavel) ? ` · ${nome(responsavel)}` : ''}</p>
        {complemento}
      </div>
      {selo}
      {acoes && <div className="-my-1 flex shrink-0 items-center">{acoes}</div>}
    </li>
  )
}
