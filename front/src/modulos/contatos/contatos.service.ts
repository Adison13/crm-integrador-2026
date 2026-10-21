import type { ContatoDto, NovoContato } from '@/model/contato'
import { chamar, type Pagina } from '@/plataforma/api'
import { consulta, corpo } from '@/lib/consulta'

/**
 * Contatos (ContatoController). Ainda não existe listagem geral de contatos no back-end — só a de
 * uma empresa —, por isso a tela lista por empresa.
 */
export const contatosService = {
  /** Exige crm.contato.ver. Ordenados por nome. */
  daEmpresa(empresaId: string, pagina: number, tamanho: number) {
    return chamar<Pagina<ContatoDto>>(`/api/crm/empresas/${empresaId}/contatos${consulta({ pagina, tamanho })}`)
  },

  buscar(id: string) {
    return chamar<ContatoDto>(`/api/crm/contatos/${id}`)
  },

  /** 409 CONTATO_DUPLICADO (mesmo e-mail na empresa) traz data.contatoId. */
  criar(dados: NovoContato) {
    return chamar<ContatoDto>('/api/crm/contatos', { method: 'POST', body: corpo(dados) })
  },

  /** O back-end mantém origem e UTM gravadas na criação. */
  editar(id: string, dados: NovoContato) {
    return chamar<ContatoDto>(`/api/crm/contatos/${id}`, { method: 'PUT', body: corpo(dados) })
  },
}
