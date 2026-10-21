/**
 * Contrato de empresa e unidade, espelho dos records do back-end (pacote empresa) e de
 * contratos/crm.yaml. Nomes de campo iguais aos do JSON: não renomeie aqui.
 * UUID e datas chegam como string (ISO 8601).
 */

export type StatusComercial = 'lead' | 'prospect' | 'cliente_ativo' | 'inativo'

/** EmpresaDto — GET /api/crm/empresas e /empresas/{id}. */
export interface EmpresaDto {
  id: string
  razaoSocial: string
  nomeFantasia: string | null
  /** 14 dígitos, sem formatação. */
  cnpj: string | null
  segmento: string | null
  porte: string | null
  cidade: string | null
  /** Sigla da UF, 2 letras. */
  estado: string | null
  /** Id do usuário no identity; o nome vem de lá. */
  vendedorResponsavel: string | null
  statusComercial: StatusComercial
  origem: string
  origemModuloId: string
  criadoEm: string
}

/** NovaEmpresa — POST /api/crm/empresas. */
export interface NovaEmpresa {
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string | null
  segmento: string | null
  porte: string | null
  cidade: string | null
  estado: string | null
  origem: string
  origemModuloId: string
}

/** EditarEmpresa — PUT /api/crm/empresas/{id}. */
export interface EditarEmpresa {
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string | null
  segmento: string | null
  porte: string | null
  cidade: string | null
  estado: string | null
  vendedorResponsavel: string | null
  statusComercial: StatusComercial | null
}

export type TipoUnidade = 'matriz' | 'filial' | 'loja' | 'escritorio'

/** UnidadeDto — GET /api/crm/empresas/{id}/unidades. */
export interface UnidadeDto {
  id: string
  empresaId: string
  tipo: TipoUnidade
  endereco: string | null
}

/** EmpresaResumoDto — GET /api/crm/empresas/resumo?ids= e /empresas/{id}/resumo. */
export interface EmpresaResumoDto {
  id: string
  razaoSocial: string
  cnpj: string | null
  cidade: string | null
}
