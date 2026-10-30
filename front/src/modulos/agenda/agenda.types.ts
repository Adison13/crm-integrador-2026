/** Tipos de tela da Agenda. O contrato fica em @/model/atividade. */

export type TPeriodo = 'semana' | 'mes'

export const PERIODOS: Record<TPeriodo, { rotulo: string; anterior: string; seguinte: string; vazio: string }> = {
  semana: { rotulo: 'Semana', anterior: 'Semana anterior', seguinte: 'Próxima semana', vazio: 'Nenhuma reunião nesta semana' },
  mes: { rotulo: 'Mês', anterior: 'Mês anterior', seguinte: 'Próximo mês', vazio: 'Nenhuma reunião neste mês' },
}

/** LocalDates "AAAA-MM-DD", os dois inclusive, como GET /api/crm/reunioes pede em `de` e `ate`. */
export interface TIntervalo {
  de: string
  ate: string
}
