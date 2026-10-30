/**
 * Contrato de oportunidade, espelho dos records do back-end (pacote oportunidade).
 * Dinheiro é número com até 2 casas; percentual em pontos (Contrato §8.7). LocalDate chega
 * como "AAAA-MM-DD".
 */

export type TipoOportunidade = 'nova' | 'upsell' | 'cross_sell'
export type StatusOportunidade = 'aberta' | 'ganha' | 'perdida'

/** Ordenações aceitas por GET /api/crm/oportunidades (OportunidadeController.ORDENACOES). */
export type OrdenacaoOportunidades =
  | 'criadoEm,desc'
  | 'criadoEm,asc'
  | 'dataProximoPasso,asc'
  | 'dataPrevistaFechamento,asc'
  | 'valorMrr,desc'

/** OportunidadeDto. */
export interface OportunidadeDto {
  id: string
  titulo: string
  empresaId: string
  contatoId: string | null
  unidadeId: string | null
  funilId: string
  etapaId: string
  tipo: TipoOportunidade
  produtoId: string | null
  valorImplantacao: number | null
  valorMrr: number | null
  probabilidade: number | null
  dataPrevistaFechamento: string | null
  proximoPasso: string | null
  dataProximoPasso: string | null
  /** Calculado pelo servidor: aberta e com a data do próximo passo já vencida. */
  proximoPassoAtrasado: boolean
  responsavelId: string | null
  equipeId: string | null
  status: StatusOportunidade
  motivoPerda: string | null
  fechadaEm: string | null
  origem: string | null
  origemModuloId: string | null
  criadoEm: string
}

/** NovaOportunidade — POST /api/crm/oportunidades. Aberta exige próximo passo e data (RF-CRM-03). */
export interface NovaOportunidade {
  titulo: string
  empresaId: string
  contatoId: string | null
  unidadeId: string | null
  /** Nula: o servidor usa a etapa inicial do funil padrão. */
  etapaId: string | null
  tipo: TipoOportunidade | null
  produtoId: string | null
  valorImplantacao: number | null
  valorMrr: number | null
  probabilidade: number | null
  dataPrevistaFechamento: string | null
  proximoPasso: string | null
  dataProximoPasso: string | null
  responsavelId: string | null
  origem: string | null
  origemModuloId: string | null
}

/** PerderOportunidade — POST /oportunidades/{id}/perder. */
export interface PerderOportunidade {
  motivo: string
}

/** EditarOportunidade — PUT /oportunidades/{id}. A etapa muda por /mover, não por aqui. */
export type EditarOportunidade = Omit<NovaOportunidade, 'etapaId' | 'origem' | 'origemModuloId'>

/** MoverOportunidade — POST /oportunidades/{id}/mover. Próximo passo e data vão juntos ou nenhum. */
export interface MoverOportunidade {
  etapaId: string
  proximoPasso: string | null
  dataProximoPasso: string | null
}
