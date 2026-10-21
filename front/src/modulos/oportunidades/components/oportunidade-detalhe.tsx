import { useState } from 'react'
import { Pencil, SearchX, ThumbsDown, Trophy, TriangleAlert, X } from 'lucide-react'
import { Link } from 'react-router'
import { Badge, Button, DetailField, DetailSection, EmptyState, Modal, Select, Spinner, Tabs, cx } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { EtapaDto } from '@/model/funil'
import type { OportunidadeDto } from '@/model/oportunidade'
import { ErroDaApi } from '@/plataforma/api'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { useUsuarios } from '@/hooks/use-usuarios'
import { data, dataHora, moeda } from '@/lib/formato'
import { useContato } from '../../contatos/use-contatos'
import { useResumoDeEmpresas } from '../../empresas/use-empresas'
import { useFunis } from '../../funil/use-funil'
import { STATUS_DA_OPORTUNIDADE, TIPOS_DE_OPORTUNIDADE } from '../oportunidades.types'
import { useAtividades, useObjecoes, useReunioes, useTarefas } from '../use-atividades'
import { useMoverOportunidade, useOportunidade } from '../use-oportunidades'
import { AbaAtividades, AbaObjecoes, AbaReunioes, AbaTarefas } from './abas-da-oportunidade'
import { NomeDaEtapa } from './etapa'
import { ConfirmarGanho, RegistrarPerda } from './fechar-oportunidade'

interface Props {
  id: string
  aoFechar: () => void
  aoEditar: (oportunidade: OportunidadeDto) => void
}

/** Detalhe da oportunidade: cabeçalho brand-950 com valores e ações, e o histórico em abas. */
export function OportunidadeDetalhe({ id, aoFechar, aoEditar }: Props) {
  const consulta = useOportunidade(id)
  const oportunidade = consulta.data
  return (
    <Modal open onClose={aoFechar} noPad size="xl" title={oportunidade?.titulo ?? 'Oportunidade'}>
      {consulta.isPending && <Spinner className="min-h-80" />}
      {consulta.isError && (
        consulta.error instanceof ErroDaApi && consulta.error.status === 404
          ? <EmptyState icon={<SearchX aria-hidden />} title="Oportunidade não encontrada" action={<Button variant="outline" onClick={aoFechar}>Fechar</Button>}>
              Ela pode ter sido excluída ou estar fora da sua carteira e das suas equipes.
            </EmptyState>
          : <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
      )}
      {oportunidade && <Conteudo oportunidade={oportunidade} aoFechar={aoFechar} aoEditar={aoEditar} />}
    </Modal>
  )
}

function Conteudo({ oportunidade: o, aoFechar, aoEditar }: { oportunidade: OportunidadeDto; aoFechar: () => void; aoEditar: (o: OportunidadeDto) => void }) {
  const [aba, setAba] = useState(0)
  const [fechando, setFechando] = useState<'ganhar' | 'perder' | null>(null)
  const nomeDaEmpresa = useResumoDeEmpresas([o.empresaId])
  const funis = useFunis()
  const { tem } = usePermissoes()
  const atividades = useAtividades(o.id)
  const tarefas = useTarefas(o.id)
  const reunioes = useReunioes(o.id)
  const objecoes = useObjecoes(o.id)
  const funil = funis.data?.find((f) => f.id === o.funilId)
  const etapa = funil?.etapas.find((e) => e.id === o.etapaId)
  const aberta = o.status === 'aberta'
  // Editar, ganhar, perder e mover exigem crm.oportunidade.editar
  const podeAlterar = aberta && tem(PERMISSOES.oportunidadeEditar)
  const contagem = (n: number | undefined) => (n === undefined ? '' : ` (${n})`)

  return (
    <>
      <div className="shrink-0 bg-brand-950 px-6 py-5 text-white">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight">{o.titulo}</h2>
            <p className="mt-0.5 text-xs text-brand-300">
              {[nomeDaEmpresa(o.empresaId), TIPOS_DE_OPORTUNIDADE[o.tipo], funil?.nome].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={STATUS_DA_OPORTUNIDADE[o.status].cor}>{STATUS_DA_OPORTUNIDADE[o.status].rotulo}</Badge>
              {aberta && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium"><NomeDaEtapa etapa={etapa} /></span>}
              {o.proximoPassoAtrasado && <Badge variant="red"><TriangleAlert aria-hidden className="size-3" /> Próximo passo atrasado</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {podeAlterar && (
              <>
                <Button variant="secondary" size="sm" onClick={() => aoEditar(o)}><Pencil aria-hidden className="size-3.5" /> Editar</Button>
                <Button size="sm" onClick={() => setFechando('ganhar')}><Trophy aria-hidden className="size-3.5" /> Ganha</Button>
                <Button variant="danger" size="sm" onClick={() => setFechando('perder')}><ThumbsDown aria-hidden className="size-3.5" /> Perdida</Button>
              </>
            )}
            <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-900 hover:text-white">
              <X aria-hidden className="size-5" />
            </button>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Implantação', moeda(o.valorImplantacao)],
            ['MRR', moeda(o.valorMrr)],
            ['Probabilidade', o.probabilidade == null ? null : `${o.probabilidade}%`],
            ['Fechamento previsto', data(o.dataPrevistaFechamento)],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="rounded-lg bg-white/5 px-3 py-2">
              <dt className="text-[11px] text-brand-300">{rotulo}</dt>
              <dd className="text-sm font-semibold">{valor ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Tabs
        tabs={['Resumo', `Atividades${contagem(atividades.data?.total)}`, `Tarefas${contagem(tarefas.data?.length)}`,
          `Reuniões${contagem(reunioes.data?.length)}`, `Objeções${contagem(objecoes.data?.length)}`]}
        active={aba}
        onChange={setAba}
      />

      <div className="min-h-72 flex-1 overflow-y-auto px-6 py-5">
        {aba === 0 && <Resumo oportunidade={o} etapas={funil?.etapas ?? []} funil={funil?.nome} podeMover={podeAlterar} />}
        {aba === 1 && <AbaAtividades oportunidade={o} />}
        {aba === 2 && <AbaTarefas oportunidade={o} />}
        {aba === 3 && <AbaReunioes oportunidade={o} />}
        {aba === 4 && <AbaObjecoes oportunidade={o} />}
      </div>

      {fechando === 'ganhar' && <ConfirmarGanho oportunidade={o} aoFechar={() => setFechando(null)} />}
      {fechando === 'perder' && <RegistrarPerda oportunidade={o} aoFechar={() => setFechando(null)} />}
    </>
  )
}

function Resumo({ oportunidade: o, etapas, funil, podeMover }: { oportunidade: OportunidadeDto; etapas: EtapaDto[]; funil: string | undefined; podeMover: boolean }) {
  const { nome } = useUsuarios()
  const mover = useMoverOportunidade()
  const nomeDaEmpresa = useResumoDeEmpresas([o.empresaId])
  const contato = useContato(o.contatoId ?? undefined)
  return (
    <>
      <DetailSection number={1} title="Próximo passo">
        <DetailField label="O que fazer" colSpan={2}>{o.proximoPasso}</DetailField>
        <DetailField label="Quando">
          {o.dataProximoPasso && <span className={cx(o.proximoPassoAtrasado && 'font-semibold text-red-600 dark:text-red-400')}>{data(o.dataProximoPasso)}{o.proximoPassoAtrasado && ' · atrasado'}</span>}
        </DetailField>
        <DetailField label="Responsável">{nome(o.responsavelId)}</DetailField>
      </DetailSection>
      <DetailSection number={2} title="Negociação">
        <DetailField label="Empresa">
          {nomeDaEmpresa(o.empresaId) && <Link to={`/empresas/${o.empresaId}`} className="text-brand-700 hover:underline dark:text-brand-400">{nomeDaEmpresa(o.empresaId)}</Link>}
        </DetailField>
        <DetailField label="Contato">
          {contato.data && <Link to={`/contatos/${contato.data.id}`} className="text-brand-700 hover:underline dark:text-brand-400">{contato.data.nome}</Link>}
        </DetailField>
        <DetailField label="Funil">{funil}</DetailField>
        <DetailField label="Etapa">
          {podeMover && etapas.length > 0 ? (
            // Alternativa de teclado ao arrastar o cartão no funil (POST /mover)
            <Select aria-label="Mover para a etapa" className="w-56" value={o.etapaId} disabled={mover.isPending}
              onChange={(e) => mover.mutate({ id: o.id, dados: { etapaId: e.target.value, proximoPasso: null, dataProximoPasso: null } })}>
              {etapas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </Select>
          ) : <NomeDaEtapa etapa={etapas.find((e) => e.id === o.etapaId)} />}
        </DetailField>
        <DetailField label="Tipo">{TIPOS_DE_OPORTUNIDADE[o.tipo]}</DetailField>
        <DetailField label="Origem">{o.origem}</DetailField>
        <DetailField label="Criada em">{dataHora(o.criadoEm)}</DetailField>
      </DetailSection>
      {o.status !== 'aberta' && (
        <DetailSection number={3} title="Fechamento">
          <DetailField label="Resultado"><Badge variant={STATUS_DA_OPORTUNIDADE[o.status].cor}>{STATUS_DA_OPORTUNIDADE[o.status].rotulo}</Badge></DetailField>
          <DetailField label="Fechada em">{dataHora(o.fechadaEm)}</DetailField>
          {o.status === 'perdida' && <DetailField label="Motivo da perda" colSpan={2}>{o.motivoPerda}</DetailField>}
        </DetailSection>
      )}
    </>
  )
}
