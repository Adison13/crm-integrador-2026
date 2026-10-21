/** Contrato de funil e etapa, espelho dos records do back-end (pacote funil). */

/** EtapaDto — a cor vem no formato #RRGGBB. */
export interface EtapaDto {
  id: string
  funilId: string
  nome: string
  ordem: number
  cor: string | null
}

/** FunilDto — GET /api/crm/funis e /funis/{id}, com as etapas já em ordem. */
export interface FunilDto {
  id: string
  nome: string
  padrao: boolean
  etapas: EtapaDto[]
}

/** NovaEtapa — POST /funis/{id}/etapas e PUT /etapas/{id}. */
export interface NovaEtapa {
  nome: string
  cor: string | null
}

/** OrdemEtapas — PUT /funis/{id}/etapas/ordem, com todas as etapas do funil. */
export interface OrdemEtapas {
  etapaIds: string[]
}

/** NovoFunil — POST /api/crm/funis. Nasce com ao menos uma etapa e não é o padrão. */
export interface NovoFunil {
  nome: string
  etapas: NovaEtapa[]
}

/** EditarFunil — PUT /api/crm/funis/{id}. padrao true passa a ser o funil padrão do tenant. */
export interface EditarFunil {
  nome: string
  padrao: boolean | null
}
