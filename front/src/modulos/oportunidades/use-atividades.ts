import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EditarTarefa, NovaReuniao, ReuniaoDto, TarefaDto } from '@/model/atividade'
import { notificarCasca } from '@/plataforma/sessao'
import { deCampoDataHora, paraCampoDataHora } from '@/lib/formato'
import { atividadesService } from './atividades.service'
import { TIPOS_DE_ATIVIDADE, type TFormAtividade, type TFormRegistroReuniao, type TFormReuniao, type TFormTarefa } from './oportunidades.types'

/** Sob ['oportunidades']: ganhar, perder e mover também recarregam estas abas. */
export const atividadesKeys = {
  atividades: (id: string) => ['oportunidades', 'atividades', id] as const,
  tarefas: (id: string) => ['oportunidades', 'tarefas', id] as const,
  reunioes: (id: string) => ['oportunidades', 'reunioes', id] as const,
  objecoes: (id: string) => ['oportunidades', 'objecoes', id] as const,
  frequentes: ['objecoes', 'frequentes'] as const,
}

export const useAtividades = (id: string) =>
  useQuery({ queryKey: atividadesKeys.atividades(id), queryFn: () => atividadesService.atividades(id) })
export const useTarefas = (id: string) =>
  useQuery({ queryKey: atividadesKeys.tarefas(id), queryFn: () => atividadesService.tarefas(id) })
export const useReunioes = (id: string) =>
  useQuery({ queryKey: atividadesKeys.reunioes(id), queryFn: () => atividadesService.reunioes(id) })
export const useObjecoes = (id: string) =>
  useQuery({ queryKey: atividadesKeys.objecoes(id), queryFn: () => atividadesService.objecoes(id) })

/** Sugestões para o campo de objeção; sem elas, o campo continua funcionando. */
export function useObjecoesFrequentes() {
  const consulta = useQuery({ queryKey: atividadesKeys.frequentes, queryFn: atividadesService.objecoesFrequentes, staleTime: 10 * 60_000 })
  return (consulta.data ?? []).map((o) => o.motivo)
}

const ouNulo = (texto: string) => texto.trim() || null
const noFuturo = (valor: string) => Boolean(valor) && new Date(valor).getTime() > Date.now() + 5 * 60_000

// ------------------------------------------------------------------ validação (as regras dos records Nova*)

export function validarAtividade(form: TFormAtividade): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.descricao.trim()) erros.descricao = 'Descreva a atividade.'
  else if (form.descricao.trim().length > 2000) erros.descricao = 'A descrição pode ter até 2000 caracteres.'
  if (noFuturo(form.realizadaEm)) erros.realizadaEm = 'Atividade registra o que já foi feito; para o futuro, crie uma tarefa.'
  return erros
}

export function validarTarefa(form: TFormTarefa): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.descricao.trim()) erros.descricao = 'Descreva a tarefa.'
  else if (form.descricao.trim().length > 500) erros.descricao = 'A descrição pode ter até 500 caracteres.'
  return erros
}

export function validarReuniao(form: TFormReuniao): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.dataHora) erros.dataHora = 'Informe a data e a hora da reunião.'
  if (form.participantes.trim().length > 2000) erros.participantes = 'Os participantes podem ter até 2000 caracteres.'
  if (form.localOuLink.trim().length > 255) erros.localOuLink = 'O local ou link pode ter até 255 caracteres.'
  if (form.pauta.trim().length > 2000) erros.pauta = 'A pauta pode ter até 2000 caracteres.'
  return erros
}

export function validarRegistro(form: TFormRegistroReuniao): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.resumo.trim()) erros.resumo = 'Informe o resumo da reunião.'
  else if (form.resumo.trim().length > 4000) erros.resumo = 'O resumo pode ter até 4000 caracteres.'
  if (!form.proximoPasso.trim()) erros.proximoPasso = 'Informe o próximo passo.'
  else if (form.proximoPasso.trim().length > 255) erros.proximoPasso = 'O próximo passo pode ter até 255 caracteres.'
  if (!form.dataProximoPasso) erros.dataProximoPasso = 'Informe a data do próximo passo.'
  if (form.objecoes.length > 20) erros.objecoes = 'Informe até 20 objeções por reunião.'
  return erros
}

// ------------------------------------------------------------------ formulários a partir do que já existe

export function formularioDaTarefa(tarefa?: TarefaDto): TFormTarefa {
  return {
    descricao: tarefa?.descricao ?? '',
    // Tipo fora da lista não volta ao servidor (seria 400): o campo fica "sem tipo"
    tipo: tarefa?.tipo && tarefa.tipo in TIPOS_DE_ATIVIDADE ? tarefa.tipo : '',
    responsavelId: tarefa?.responsavelId ?? '',
    dataVencimento: paraCampoDataHora(tarefa?.dataVencimento),
  }
}

export function formularioDaReuniao(reuniao?: ReuniaoDto): TFormReuniao {
  return {
    dataHora: paraCampoDataHora(reuniao?.dataHora),
    participantes: reuniao?.participantes ?? '',
    localOuLink: reuniao?.localOuLink ?? '',
    pauta: reuniao?.pauta ?? '',
  }
}

function paraTarefa(form: TFormTarefa): EditarTarefa {
  return {
    descricao: form.descricao.trim(),
    tipo: form.tipo || null,
    responsavelId: ouNulo(form.responsavelId),
    dataVencimento: deCampoDataHora(form.dataVencimento),
  }
}

function paraReuniao(form: TFormReuniao): NovaReuniao {
  return {
    dataHora: deCampoDataHora(form.dataHora) ?? '',
    participantes: ouNulo(form.participantes),
    localOuLink: ouNulo(form.localOuLink),
    pauta: ouNulo(form.pauta),
  }
}

// ------------------------------------------------------------------ gravações

/** Toda gravação recarrega a oportunidade e as abas: o registro de reunião muda o próximo passo. */
function useGravacao<V, R>(gravar: (variaveis: V) => Promise<R>, aviso: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: gravar,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['oportunidades'] })
      void cliente.invalidateQueries({ queryKey: atividadesKeys.frequentes })
      notificarCasca('sucesso', aviso)
    },
  })
}

export const useRegistrarAtividade = (oportunidadeId: string) =>
  useGravacao((form: TFormAtividade) => atividadesService.registrarAtividade(oportunidadeId, {
    tipo: form.tipo, descricao: form.descricao.trim(), realizadaEm: deCampoDataHora(form.realizadaEm),
  }), 'Atividade registrada.')

export const useExcluirAtividade = () =>
  useGravacao((id: string) => atividadesService.excluirAtividade(id), 'Atividade excluída.')

export const useSalvarTarefa = (oportunidadeId: string | null) =>
  useGravacao(({ id, form }: { id?: string; form: TFormTarefa }) => (id
    ? atividadesService.editarTarefa(id, paraTarefa(form))
    : atividadesService.criarTarefa({ ...paraTarefa(form), oportunidadeId })), 'Tarefa salva.')

export const useConcluirTarefa = () =>
  useGravacao((id: string) => atividadesService.concluirTarefa(id), 'Tarefa concluída.')

export const useExcluirTarefa = () =>
  useGravacao((id: string) => atividadesService.excluirTarefa(id), 'Tarefa excluída.')

export const useSalvarReuniao = (oportunidadeId: string) =>
  useGravacao(({ id, form }: { id?: string; form: TFormReuniao }) => (id
    ? atividadesService.reagendarReuniao(id, paraReuniao(form))
    : atividadesService.agendarReuniao(oportunidadeId, paraReuniao(form))), 'Reunião salva.')

export const useCancelarReuniao = () =>
  useGravacao((id: string) => atividadesService.cancelarReuniao(id), 'Reunião cancelada.')

export const useRegistrarReuniao = () =>
  useGravacao(({ id, form }: { id: string; form: TFormRegistroReuniao }) => atividadesService.registrarReuniao(id, {
    resumo: form.resumo.trim(),
    proximoPasso: form.proximoPasso.trim(),
    dataProximoPasso: form.dataProximoPasso,
    objecoes: form.objecoes.map((o) => o.trim()).filter(Boolean),
  }), 'Reunião registrada. O próximo passo da oportunidade foi atualizado.')

export const useRegistrarObjecao = (oportunidadeId: string) =>
  useGravacao((motivo: string) => atividadesService.registrarObjecao(oportunidadeId, { motivo: motivo.trim() }), 'Objeção registrada.')

export const useExcluirObjecao = () =>
  useGravacao((id: string) => atividadesService.excluirObjecao(id), 'Objeção excluída.')
