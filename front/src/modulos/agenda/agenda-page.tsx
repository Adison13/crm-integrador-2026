import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { Badge, Button, EmptyState, FilterBar, PageHeader, Select, Spinner } from '@/components/ui'
import { ConfirmarExclusao } from '@/components/confirmar-exclusao'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { ReuniaoDto } from '@/model/atividade'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { data, dataCurta, dataHora, diaPorExtenso, hoje, hora, paraDataLocal } from '@/lib/formato'
import { BotaoIcone } from '../oportunidades/components/abas-da-oportunidade'
import { RegistroReuniaoModal } from '../oportunidades/components/registro-reuniao-modal'
import { ReuniaoModal } from '../oportunidades/components/reuniao-modal'
import { useCancelarReuniao } from '../oportunidades/use-atividades'
import { useTitulosDasOportunidades } from '../oportunidades/use-oportunidades'
import { PERIODOS, type TIntervalo, type TPeriodo } from './agenda.types'
import { deslocar, intervaloDe, porDia, useAgenda } from './use-agenda'

const MES_E_ANO = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

/** "27/10 a 02/11/2026" na semana; "outubro de 2026" no mês. */
function rotuloDo(periodo: TPeriodo, { de, ate }: TIntervalo) {
  return periodo === 'mes' ? MES_E_ANO.format(paraDataLocal(de)) : `${dataCurta(de)} a ${data(ate)}`
}

const ehLink = (texto: string) => /^https?:\/\//i.test(texto)

/**
 * Reuniões da semana ou do mês (GET /reunioes), por dia — as das oportunidades que o usuário
 * enxerga. Reagendar, cancelar e registrar exigem crm.oportunidade.editar e só valem para
 * reunião ainda não registrada (409 REUNIAO_REGISTRADA).
 */
export function AgendaPage() {
  const [periodo, setPeriodo] = useState<TPeriodo>('semana')
  const [referencia, setReferencia] = useState(hoje)
  const [reagendando, setReagendando] = useState<ReuniaoDto | null>(null)
  const [registrando, setRegistrando] = useState<ReuniaoDto | null>(null)
  const [cancelando, setCancelando] = useState<ReuniaoDto | null>(null)

  const intervalo = intervaloDe(periodo, referencia)
  const consulta = useAgenda(intervalo)
  const reunioes = consulta.data ?? []
  const tituloDa = useTitulosDasOportunidades(reunioes.map((r) => r.oportunidadeId))
  const podeEditar = usePermissoes().tem(PERMISSOES.oportunidadeEditar)
  const cancelar = useCancelarReuniao()
  const diaDeHoje = hoje()
  const noPeriodoAtual = diaDeHoje >= intervalo.de && diaDeHoje <= intervalo.ate
  const rotulo = rotuloDo(periodo, intervalo)

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={consulta.isError ? 'Não foi possível carregar' : !consulta.data ? 'Carregando…' : `${rotulo} · ${reunioes.length} ${reunioes.length === 1 ? 'reunião' : 'reuniões'}`}
      />

      <FilterBar>
        <Select aria-label="Período" className="w-32" value={periodo} onChange={(e) => setPeriodo(e.target.value as TPeriodo)}>
          {Object.entries(PERIODOS).map(([valor, { rotulo: r }]) => <option key={valor} value={valor}>{r}</option>)}
        </Select>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label={PERIODOS[periodo].anterior} title={PERIODOS[periodo].anterior}
            onClick={() => setReferencia((atual) => deslocar(periodo, atual, -1))}>
            <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={noPeriodoAtual} onClick={() => setReferencia(hoje())}>Hoje</Button>
          <Button variant="ghost" size="sm" aria-label={PERIODOS[periodo].seguinte} title={PERIODOS[periodo].seguinte}
            onClick={() => setReferencia((atual) => deslocar(periodo, atual, 1))}>
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        </div>
        <p className="text-sm font-semibold text-titulo first-letter:uppercase">{rotulo}</p>
      </FilterBar>

      <section aria-live="polite" className="flex-1 p-5">
        {consulta.isPending && <Spinner />}
        {consulta.isError && <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
        {consulta.isSuccess && reunioes.length === 0 && (
          <EmptyState icon={<CalendarDays aria-hidden />} title={PERIODOS[periodo].vazio}>
            Aparecem aqui as reuniões das oportunidades que você enxerga: as suas, as das suas equipes e as ainda sem responsável.
          </EmptyState>
        )}
        <div className="space-y-5">
          {porDia(reunioes).map(([dia, doDia]) => (
            <section key={dia} aria-labelledby={`dia-${dia}`}>
              <h2 id={`dia-${dia}`} className="mb-2 flex items-center gap-2 text-sm font-semibold text-titulo first-letter:uppercase">
                {diaPorExtenso(dia)}
                {dia === diaDeHoje && <Badge variant="blue">hoje</Badge>}
              </h2>
              <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda bg-superficie shadow-sm">
                {doDia.map((r) => {
                  const passou = new Date(r.dataHora).getTime() < Date.now()
                  return (
                    <li key={r.id} className="flex items-start gap-4 px-4 py-3">
                      <p className="w-12 shrink-0 pt-px text-sm font-semibold text-titulo tabular-nums">{hora(r.dataHora)}</p>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-texto">{r.pauta ?? 'Reunião sem pauta'}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-1 text-xs text-texto-3">
                          <Link to={`/oportunidades/${r.oportunidadeId}`} className="text-brand-700 hover:underline dark:text-brand-400">
                            {tituloDa(r.oportunidadeId) ?? 'Abrir oportunidade'}
                          </Link>
                          {r.localOuLink && (
                            <span>· {ehLink(r.localOuLink)
                              ? <a href={r.localOuLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-titulo hover:underline">
                                  {r.localOuLink}<ExternalLink aria-hidden className="size-3" />
                                </a>
                              : r.localOuLink}</span>
                          )}
                          {r.participantes && <span>· {r.participantes}</span>}
                        </p>
                        {r.registrada && r.resumo && (
                          <p className="mt-2 rounded-lg bg-superficie-2 px-3 py-2 text-xs text-texto-2">
                            {r.resumo}{r.proximoPasso && <><br /><strong className="text-titulo">Próximo passo:</strong> {r.proximoPasso}</>}
                          </p>
                        )}
                      </div>
                      {r.registrada
                        ? <Badge variant="green">registrada</Badge>
                        : passou ? <Badge variant="yellow">a registrar</Badge> : <Badge variant="blue">agendada</Badge>}
                      {/* Registrada, a reunião não muda mais (409 REUNIAO_REGISTRADA) */}
                      {podeEditar && !r.registrada && (
                        <div className="-my-1 flex shrink-0 items-center">
                          <BotaoIcone icone={ClipboardCheck} rotulo="Registrar como foi" onClick={() => setRegistrando(r)} />
                          <BotaoIcone icone={Pencil} rotulo="Reagendar" onClick={() => setReagendando(r)} />
                          <BotaoIcone icone={Trash2} rotulo="Cancelar reunião" perigo onClick={() => setCancelando(r)} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>

      {reagendando && (
        <ReuniaoModal key={reagendando.id} oportunidadeId={reagendando.oportunidadeId} reuniao={reagendando} aoFechar={() => setReagendando(null)} />
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
