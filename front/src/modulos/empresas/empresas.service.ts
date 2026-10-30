import type { EditarEmpresa, EmpresaDto, EmpresaResumoDto, NovaEmpresa, UnidadeDto } from '@/model/empresa'
import { chamar, type Pagina } from '@/plataforma/api'
import { consulta, corpo } from '@/lib/consulta'
import type { TFiltroEmpresas } from './empresas.types'

const BASE = '/api/crm/empresas'

/** Empresas do tenant (EmpresaController). */
export const empresasService = {
  /** Exige crm.empresa.ver. Ordenada por razão social; tamanho de 1 a 100. */
  listar(filtro: TFiltroEmpresas, pagina: number, tamanho: number) {
    return chamar<Pagina<EmpresaDto>>(BASE + consulta({
      pagina, tamanho, ordenar: 'razaoSocial,asc', segmento: filtro.segmento, status: filtro.status,
    }))
  },

  buscar(id: string) {
    return chamar<EmpresaDto>(`${BASE}/${id}`)
  },

  /** Razão social, CNPJ e cidade de até 100 empresas — exige só crm.empresa.ver_resumo (§9.4). */
  resumo(ids: string[]) {
    return chamar<EmpresaResumoDto[]>(`${BASE}/resumo${consulta({ ids })}`)
  },

  /** Matriz primeiro. */
  unidades(id: string) {
    return chamar<UnidadeDto[]>(`${BASE}/${id}/unidades`)
  },

  /** 409 EMPRESA_DUPLICADA traz data.empresaId para reaproveitar (§10.3). */
  criar(dados: NovaEmpresa) {
    return chamar<EmpresaDto>(BASE, { method: 'POST', body: corpo(dados) })
  },

  editar(id: string, dados: EditarEmpresa) {
    return chamar<EmpresaDto>(`${BASE}/${id}`, { method: 'PUT', body: corpo(dados) })
  },
}
