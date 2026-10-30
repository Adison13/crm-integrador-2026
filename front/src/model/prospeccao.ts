/** Contrato da prospecção, espelho do pacote prospeccao do back-end. */
import type { StatusComercial } from './empresa'

export type CanalTentativa = 'telefone' | 'email' | 'whatsapp' | 'linkedin' | 'visita'
export type ResultadoTentativa =
  | 'sem_resposta'
  | 'contato_realizado'
  | 'retornar_depois'
  | 'sem_interesse'
  | 'numero_invalido'

/** TentativaDto. */
export interface TentativaDto {
  id: string
  empresaId: string
  contatoId: string | null
  canal: CanalTentativa
  resultado: ResultadoTentativa
  observacao: string | null
  realizadaEm: string
  responsavelId: string | null
}

/** ItemProspeccao — GET /api/crm/prospeccao: empresa em lead ou prospect com o resumo das tentativas. */
export interface ItemProspeccao {
  id: string
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string | null
  segmento: string | null
  porte: string | null
  cidade: string | null
  estado: string | null
  vendedorResponsavel: string | null
  statusComercial: Extract<StatusComercial, 'lead' | 'prospect'>
  totalTentativas: number
  ultimaTentativa: TentativaDto | null
}

/** NovaTentativa — POST /api/crm/empresas/{id}/tentativas. */
export interface NovaTentativa {
  canal: CanalTentativa
  resultado: ResultadoTentativa
  contatoId: string | null
  observacao: string | null
  realizadaEm: string | null
}

/** ConverterEmpresa — POST /api/crm/empresas/{id}/converter. */
export interface ConverterEmpresa {
  titulo: string
  contatoId: string | null
  produtoId: string | null
  valorImplantacao: number | null
  valorMrr: number | null
  probabilidade: number | null
  dataPrevistaFechamento: string | null
  proximoPasso: string | null
  dataProximoPasso: string | null
  responsavelId: string | null
}
