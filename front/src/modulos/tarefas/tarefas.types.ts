/** Tipos de tela de Tarefas. O contrato fica em @/model/atividade. */

/** Os recortes que GET /api/crm/tarefas aceita: status=pendente, vencidas=true, status=concluida ou nenhum. */
export type TSituacaoTarefas = 'pendentes' | 'vencidas' | 'concluidas' | 'todas'

export const SITUACAO_INICIAL: TSituacaoTarefas = 'pendentes'

export const SITUACOES: Record<TSituacaoTarefas, { rotulo: string; vazio: string }> = {
  pendentes: { rotulo: 'Pendentes', vazio: 'Nenhuma tarefa pendente' },
  vencidas: { rotulo: 'Vencidas', vazio: 'Nenhuma tarefa vencida' },
  concluidas: { rotulo: 'Concluídas', vazio: 'Nenhuma tarefa concluída' },
  todas: { rotulo: 'Todas', vazio: 'Nenhuma tarefa' },
}
