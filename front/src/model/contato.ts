/** Contrato de contato, espelho dos records do back-end (pacote contato) e de contratos/crm.yaml. */

export type PapelContato = 'decisor' | 'influenciador' | 'tecnico' | 'financeiro' | 'proprietario' | 'outro'
export type ConsentimentoLgpd = 'concedido' | 'pendente' | 'revogado'
export type PreferenciaComunicacao = 'telefone' | 'whatsapp' | 'email'

/** ContatoDto — GET /api/crm/contatos/{id} e /empresas/{id}/contatos. */
export interface ContatoDto {
  id: string
  empresaId: string
  nome: string
  cargo: string | null
  email: string | null
  telefone: string | null
  papel: PapelContato | null
  consentimentoLgpd: ConsentimentoLgpd | null
  preferenciaComunicacao: PreferenciaComunicacao | null
  origem: string | null
  origemModuloId: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  criadoEm: string
}

/** NovoContato — corpo de POST /api/crm/contatos e de PUT /api/crm/contatos/{id}. */
export interface NovoContato {
  empresaId: string
  nome: string
  cargo: string | null
  email: string | null
  telefone: string | null
  papel: PapelContato | null
  consentimentoLgpd: ConsentimentoLgpd | null
  preferenciaComunicacao: PreferenciaComunicacao | null
  origem: string | null
  origemModuloId: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}
