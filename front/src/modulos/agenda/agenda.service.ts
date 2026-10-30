import type { ReuniaoDto } from '@/model/atividade'
import { chamar } from '@/plataforma/api'
import { consulta } from '@/lib/consulta'
import type { TIntervalo } from './agenda.types'

/**
 * Agenda de reuniões, RF-CRM-11 (ReuniaoController). Reagendar, cancelar e registrar são as mesmas
 * rotas da aba Reuniões da oportunidade, em atividadesService.
 */
export const agendaService = {
  /**
   * Exige crm.oportunidade.ver. Reuniões das oportunidades que o usuário enxerga, de `de` a `ate`
   * (inclusive, no fuso de São Paulo), por horário. Mais de 62 dias responde 400.
   */
  reunioes({ de, ate }: TIntervalo) {
    return chamar<ReuniaoDto[]>('/api/crm/reunioes' + consulta({ de, ate }))
  },
}
