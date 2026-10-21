import type {
  AtividadeDto, EditarTarefa, NovaAtividade, NovaObjecao, NovaReuniao, NovaTarefa, ObjecaoDto, ObjecaoFrequenteDto,
  RegistroReuniao, ReuniaoDto, TarefaDto,
} from '@/model/atividade'
import { chamar, type Pagina } from '@/plataforma/api'
import { consulta, corpo } from '@/lib/consulta'

const OPORTUNIDADES = '/api/crm/oportunidades'

/**
 * O que acontece dentro de uma oportunidade (AtividadeController, TarefaController,
 * ReuniaoController). Ler exige crm.oportunidade.ver; gravar, crm.oportunidade.editar — exceto
 * editar e concluir a própria tarefa, que o responsável faz só com crm.oportunidade.ver.
 */
export const atividadesService = {
  // ------------------------------------------------------------------ atividades (o que já foi feito)

  /** Até 100, mais recentes primeiro. */
  atividades(oportunidadeId: string) {
    return chamar<Pagina<AtividadeDto>>(`${OPORTUNIDADES}/${oportunidadeId}/atividades${consulta({ pagina: 0, tamanho: 100 })}`)
  },

  /** Data futura responde 400: para o futuro, o caminho é uma tarefa. */
  registrarAtividade(oportunidadeId: string, dados: NovaAtividade) {
    return chamar<AtividadeDto>(`${OPORTUNIDADES}/${oportunidadeId}/atividades`, { method: 'POST', body: corpo(dados) })
  },

  excluirAtividade(id: string) {
    return chamar<void>(`/api/crm/atividades/${id}`, { method: 'DELETE' })
  },

  // ------------------------------------------------------------------ tarefas (o que falta fazer)

  /** Pendentes primeiro, por vencimento. */
  tarefas(oportunidadeId: string) {
    return chamar<TarefaDto[]>(`${OPORTUNIDADES}/${oportunidadeId}/tarefas`)
  },

  criarTarefa(dados: NovaTarefa) {
    return chamar<TarefaDto>('/api/crm/tarefas', { method: 'POST', body: corpo(dados) })
  },

  editarTarefa(id: string, dados: EditarTarefa) {
    return chamar<TarefaDto>(`/api/crm/tarefas/${id}`, { method: 'PUT', body: corpo(dados) })
  },

  /** Já concluída responde 409 TAREFA_CONCLUIDA. */
  concluirTarefa(id: string) {
    return chamar<TarefaDto>(`/api/crm/tarefas/${id}/concluir`, { method: 'POST' })
  },

  excluirTarefa(id: string) {
    return chamar<void>(`/api/crm/tarefas/${id}`, { method: 'DELETE' })
  },

  // ------------------------------------------------------------------ reuniões

  /** Mais recentes primeiro. */
  reunioes(oportunidadeId: string) {
    return chamar<ReuniaoDto[]>(`${OPORTUNIDADES}/${oportunidadeId}/reunioes`)
  },

  /** Oportunidade fechada responde 409 OPORTUNIDADE_FECHADA. */
  agendarReuniao(oportunidadeId: string, dados: NovaReuniao) {
    return chamar<ReuniaoDto>(`${OPORTUNIDADES}/${oportunidadeId}/reunioes`, { method: 'POST', body: corpo(dados) })
  },

  /** Reunião já registrada não muda nem é cancelada (409 REUNIAO_REGISTRADA). */
  reagendarReuniao(id: string, dados: NovaReuniao) {
    return chamar<ReuniaoDto>(`/api/crm/reunioes/${id}`, { method: 'PUT', body: corpo(dados) })
  },

  cancelarReuniao(id: string) {
    return chamar<void>(`/api/crm/reunioes/${id}`, { method: 'DELETE' })
  },

  /** Registro pós-reunião: grava o resumo, define o próximo passo da oportunidade e as objeções. */
  registrarReuniao(id: string, dados: RegistroReuniao) {
    return chamar<ReuniaoDto>(`/api/crm/reunioes/${id}/registro`, { method: 'POST', body: corpo(dados) })
  },

  // ------------------------------------------------------------------ objeções

  /** Mais recentes primeiro. */
  objecoes(oportunidadeId: string) {
    return chamar<ObjecaoDto[]>(`${OPORTUNIDADES}/${oportunidadeId}/objecoes`)
  },

  registrarObjecao(oportunidadeId: string, dados: NovaObjecao) {
    return chamar<ObjecaoDto>(`${OPORTUNIDADES}/${oportunidadeId}/objecoes`, { method: 'POST', body: corpo(dados) })
  },

  excluirObjecao(id: string) {
    return chamar<void>(`/api/crm/objecoes/${id}`, { method: 'DELETE' })
  },

  /** Os 20 motivos mais registrados no tenant — sugestões ao digitar uma objeção. */
  objecoesFrequentes() {
    return chamar<ObjecaoFrequenteDto[]>('/api/crm/objecoes/frequentes')
  },
}
