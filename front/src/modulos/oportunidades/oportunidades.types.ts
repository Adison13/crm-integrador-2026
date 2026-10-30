/** Tipos de tela de Oportunidades: filtro, formulário e rótulos. O contrato fica em @/model/oportunidade. */
import type { TipoAtividade, TipoTarefa } from '@/model/atividade'
import type { OrdenacaoOportunidades, StatusOportunidade, TipoOportunidade } from '@/model/oportunidade'

/** Os filtros e ordenações que GET /api/crm/oportunidades aceita. */
export interface TFiltroOportunidades {
  status: StatusOportunidade | ''
  funilId: string
  etapaId: string
  responsavelId: string
  empresaId: string
  ordenar: OrdenacaoOportunidades
}

export const FILTRO_INICIAL: TFiltroOportunidades = {
  status: 'aberta', funilId: '', etapaId: '', responsavelId: '', empresaId: '', ordenar: 'dataProximoPasso,asc',
}

/** Valores como o usuário digita: dinheiro em "48.000,00", datas em "AAAA-MM-DD" do input date. */
export interface TFormOportunidade {
  titulo: string
  empresaId: string
  contatoId: string
  etapaId: string
  tipo: TipoOportunidade
  valorImplantacao: string
  valorMrr: string
  probabilidade: string
  dataPrevistaFechamento: string
  proximoPasso: string
  dataProximoPasso: string
  responsavelId: string
}

export const TIPOS_DE_OPORTUNIDADE: Record<TipoOportunidade, string> = {
  nova: 'Nova',
  upsell: 'Upsell',
  cross_sell: 'Cross-sell',
}

export const STATUS_DA_OPORTUNIDADE: Record<StatusOportunidade, { rotulo: string; cor: 'blue' | 'green' | 'red' }> = {
  aberta: { rotulo: 'Aberta', cor: 'blue' },
  ganha: { rotulo: 'Ganha', cor: 'green' },
  perdida: { rotulo: 'Perdida', cor: 'red' },
}

export const ORDENACOES: Record<OrdenacaoOportunidades, string> = {
  'dataProximoPasso,asc': 'Próximo passo',
  'dataPrevistaFechamento,asc': 'Fechamento previsto',
  'valorMrr,desc': 'Maior MRR',
  'criadoEm,desc': 'Mais recentes',
  'criadoEm,asc': 'Mais antigas',
}

/** Tipos de atividade e de tarefa (TipoTarefa inclui todos os de TipoAtividade). */
export const TIPOS_DE_ATIVIDADE: Record<TipoTarefa, string> = {
  ligacao: 'Ligação',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  visita: 'Visita',
  reuniao: 'Reunião',
  follow_up: 'Follow-up',
  outro: 'Outro',
}

// ------------------------------------------------------------------ dentro da oportunidade

/** Datas e horas como o input datetime-local entrega: "AAAA-MM-DDTHH:mm", no fuso do navegador. */
export interface TFormAtividade {
  tipo: TipoAtividade
  descricao: string
  realizadaEm: string
}

export interface TFormTarefa {
  descricao: string
  tipo: TipoTarefa | ''
  responsavelId: string
  dataVencimento: string
}

export interface TFormReuniao {
  dataHora: string
  participantes: string
  localOuLink: string
  pauta: string
}

export interface TFormRegistroReuniao {
  resumo: string
  proximoPasso: string
  /** LocalDate "AAAA-MM-DD" do input date. */
  dataProximoPasso: string
  objecoes: string[]
}
