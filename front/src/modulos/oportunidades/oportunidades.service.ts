import type {
  EditarOportunidade, MoverOportunidade, NovaOportunidade, OportunidadeDto, PerderOportunidade,
} from '@/model/oportunidade'
import { chamar, type Pagina } from '@/plataforma/api'
import { consulta, corpo } from '@/lib/consulta'
import type { TFiltroOportunidades } from './oportunidades.types'

const BASE = '/api/crm/oportunidades'

/**
 * Oportunidades (OportunidadeController). Leitura exige crm.oportunidade.ver e o back-end aplica
 * o recorte por dono e equipe (§5.3): fora dele, 404. Atividades, tarefas, reuniões e objeções
 * ficam em atividades.service.ts.
 */
export const oportunidadesService = {
  listar(filtro: TFiltroOportunidades, pagina: number, tamanho: number) {
    return chamar<Pagina<OportunidadeDto>>(BASE + consulta({
      pagina, tamanho, ordenar: filtro.ordenar, funilId: filtro.funilId, etapaId: filtro.etapaId,
      status: filtro.status, responsavelId: filtro.responsavelId, empresaId: filtro.empresaId,
    }))
  },

  buscar(id: string) {
    return chamar<OportunidadeDto>(`${BASE}/${id}`)
  },

  /** Exige crm.oportunidade.criar. Sem etapa, entra na primeira do funil padrão. */
  criar(dados: NovaOportunidade) {
    return chamar<OportunidadeDto>(BASE, { method: 'POST', body: corpo(dados) })
  },

  /** Exige crm.oportunidade.editar; fechada responde 409 OPORTUNIDADE_FECHADA. */
  editar(id: string, dados: EditarOportunidade) {
    return chamar<OportunidadeDto>(`${BASE}/${id}`, { method: 'PUT', body: corpo(dados) })
  },

  /** A etapa de destino precisa ser do mesmo funil (ETAPA_DE_OUTRO_FUNIL). */
  mover(id: string, dados: MoverOportunidade) {
    return chamar<OportunidadeDto>(`${BASE}/${id}/mover`, { method: 'POST', body: corpo(dados) })
  },

  /** Publica crm.oportunidade.ganha para Contratos e Financeiro. */
  ganhar(id: string) {
    return chamar<OportunidadeDto>(`${BASE}/${id}/ganhar`, { method: 'POST' })
  },

  perder(id: string, dados: PerderOportunidade) {
    return chamar<OportunidadeDto>(`${BASE}/${id}/perder`, { method: 'POST', body: corpo(dados) })
  },
}
