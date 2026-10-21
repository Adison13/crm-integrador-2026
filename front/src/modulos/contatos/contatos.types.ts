/** Tipos de tela de Contatos: filtro, formulário e rótulos. O contrato fica em @/model/contato. */
import type { ConsentimentoLgpd, PapelContato, PreferenciaComunicacao } from '@/model/contato'

export interface TFormContato {
  empresaId: string
  nome: string
  cargo: string
  email: string
  telefone: string
  papel: PapelContato | ''
  consentimentoLgpd: ConsentimentoLgpd | ''
  preferenciaComunicacao: PreferenciaComunicacao | ''
}

type VarianteDeBadge = 'indigo' | 'blue' | 'gray' | 'purple' | 'yellow'

export const PAPEIS: Record<PapelContato, { rotulo: string; cor: VarianteDeBadge }> = {
  decisor: { rotulo: 'Decisor', cor: 'indigo' },
  influenciador: { rotulo: 'Influenciador', cor: 'blue' },
  tecnico: { rotulo: 'Técnico', cor: 'gray' },
  financeiro: { rotulo: 'Financeiro', cor: 'purple' },
  proprietario: { rotulo: 'Proprietário', cor: 'yellow' },
  outro: { rotulo: 'Outro', cor: 'gray' },
}

export const CONSENTIMENTOS: Record<ConsentimentoLgpd, string> = {
  concedido: 'Concedido',
  pendente: 'Pendente',
  revogado: 'Revogado',
}

export const PREFERENCIAS: Record<PreferenciaComunicacao, string> = {
  telefone: 'Telefone',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
}

/** Origem gravada nos contatos criados por esta tela. */
export const ORIGEM_DA_TELA = { origem: 'crm', origemModuloId: 'cadastro-manual' }
