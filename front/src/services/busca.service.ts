import type { ResultadoBuscaDto } from '@/model/busca'
import { chamar } from '@/plataforma/api'
import { consulta } from '@/lib/consulta'

/**
 * Busca do CRM (BuscaController): até cinco empresas e contatos, intercalados, com rota relativa
 * ao front do módulo. Exige só crm.empresa.ver_resumo. A casca usa esta rota na busca global; o
 * front do CRM usa para escolher empresa quando o perfil não tem crm.empresa.ver.
 * q precisa de 2 a 100 caracteres.
 */
export const buscaService = {
  buscar(q: string, signal?: AbortSignal) {
    return chamar<ResultadoBuscaDto[]>(`/api/crm/busca${consulta({ q })}`, { signal })
  },
}
