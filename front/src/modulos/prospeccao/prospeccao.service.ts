import type { OportunidadeDto } from '@/model/oportunidade'
import type { ConverterEmpresa, ItemProspeccao, NovaTentativa, TentativaDto } from '@/model/prospeccao'
import { chamar, type Pagina } from '@/plataforma/api'
import { consulta, corpo } from '@/lib/consulta'
import type { TFiltroProspeccao } from './prospeccao.types'

/** Prospecção, RF-CRM-08 e 09 (ProspeccaoController). */
export const prospeccaoService = {
  /** Exige crm.prospeccao.ver. Empresas em lead ou prospect, por razão social. */
  listar(filtro: TFiltroProspeccao, pagina: number, tamanho: number) {
    return chamar<Pagina<ItemProspeccao>>('/api/crm/prospeccao' + consulta({
      pagina, tamanho, status: filtro.status, segmento: filtro.segmento, cidade: filtro.cidade.trim(),
      porte: filtro.porte, vendedorId: filtro.vendedorId,
    }))
  },

  /** Até 100 tentativas, mais recentes primeiro. */
  tentativas(empresaId: string) {
    return chamar<Pagina<TentativaDto>>(`/api/crm/empresas/${empresaId}/tentativas${consulta({ pagina: 0, tamanho: 100 })}`)
  },

  /** Exige crm.prospeccao.registrar. Data futura responde 400: para o futuro, o caminho é uma tarefa. */
  registrar(empresaId: string, dados: NovaTentativa) {
    return chamar<TentativaDto>(`/api/crm/empresas/${empresaId}/tentativas`, { method: 'POST', body: corpo(dados) })
  },

  /** Exige crm.prospeccao.registrar; a tentativa de outra pessoa também exige crm.oportunidade.editar. */
  excluirTentativa(id: string) {
    return chamar<void>(`/api/crm/tentativas/${id}`, { method: 'DELETE' })
  },

  /**
   * Exige crm.oportunidade.criar. Cria a oportunidade na primeira etapa do funil padrão e passa
   * a empresa de lead a prospect; fora da prospecção, 409 EMPRESA_FORA_DA_PROSPECCAO.
   */
  converter(empresaId: string, dados: ConverterEmpresa) {
    return chamar<OportunidadeDto>(`/api/crm/empresas/${empresaId}/converter`, { method: 'POST', body: corpo(dados) })
  },
}
