import type { CnpjDto, EditarEmpresa, EmpresaDto, EmpresaResumoDto, NovaEmpresa, UnidadeDto } from '@/model/empresa'
import { chamar, type Pagina } from '@/plataforma/api'
import { consulta, corpo } from '@/lib/consulta'
import { somenteDigitos } from '@/lib/formato'
import type { TFiltroEmpresas } from './empresas.types'

const BASE = '/api/crm/empresas'

/**
 * O back espera até 3 s pela Receita antes de devolver 503. Este limite é maior para o front
 * receber essa resposta (com a mensagem certa) em vez de desistir antes.
 */
const TEMPO_LIMITE_CNPJ = 10_000

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

  /**
   * Dados cadastrais do CNPJ na Receita, pelo nosso back (CnpjController) — o navegador nunca
   * fala direto com a BrasilAPI. Exige crm.empresa.criar. 400 se não tiver 14 dígitos, 404 se a
   * Receita não conhece o CNPJ, 503 se a consulta estiver fora do ar (o cadastro manual segue valendo).
   */
  consultarCnpj(cnpj: string) {
    return chamar<CnpjDto>(`/api/crm/cnpj/${somenteDigitos(cnpj)}`, { signal: AbortSignal.timeout(TEMPO_LIMITE_CNPJ) })
  },
}
