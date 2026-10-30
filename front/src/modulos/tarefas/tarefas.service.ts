import type { StatusTarefa, TarefaDto } from '@/model/atividade'
import { chamar, type Pagina } from '@/plataforma/api'
import { consulta } from '@/lib/consulta'
import type { TSituacaoTarefas } from './tarefas.types'

/** vencidas=true já devolve só as pendentes com vencimento passado (RF-CRM-16). */
const PARAMETROS: Record<TSituacaoTarefas, { status?: StatusTarefa; vencidas?: boolean }> = {
  pendentes: { status: 'pendente' },
  vencidas: { vencidas: true },
  concluidas: { status: 'concluida' },
  todas: {},
}

/**
 * Minhas tarefas, de todas as oportunidades (TarefaController). Editar e concluir são as mesmas
 * rotas da aba Tarefas da oportunidade, em atividadesService.
 */
export const tarefasService = {
  /** Exige crm.oportunidade.ver. Sem responsavelId, as do próprio usuário; por vencimento, sem data por último. */
  minhas(situacao: TSituacaoTarefas, pagina: number, tamanho: number) {
    return chamar<Pagina<TarefaDto>>('/api/crm/tarefas' + consulta({ pagina, tamanho, ...PARAMETROS[situacao] }))
  },
}
