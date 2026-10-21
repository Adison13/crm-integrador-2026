/** Tipos de tela da Prospecção. O contrato fica em @/model/prospeccao. */
import type { CanalTentativa, ResultadoTentativa } from '@/model/prospeccao'

/** Os filtros que GET /api/crm/prospeccao aceita. A cidade vale pelo nome inteiro: maiúsculas não importam, acentos sim. */
export interface TFiltroProspeccao {
  status: 'lead' | 'prospect' | ''
  segmento: string
  cidade: string
  porte: string
  vendedorId: string
}

export const FILTRO_INICIAL: TFiltroProspeccao = { status: '', segmento: '', cidade: '', porte: '', vendedorId: '' }

export interface TFormTentativa {
  canal: CanalTentativa | ''
  resultado: ResultadoTentativa | ''
  contatoId: string
  observacao: string
  /** datetime-local: "AAAA-MM-DDTHH:mm", no fuso do navegador. */
  realizadaEm: string
}

export const CANAIS: Record<CanalTentativa, string> = {
  telefone: 'Telefone',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  visita: 'Visita',
}

type VarianteDeBadge = 'green' | 'gray' | 'yellow' | 'red' | 'orange'

export const RESULTADOS: Record<ResultadoTentativa, { rotulo: string; cor: VarianteDeBadge }> = {
  contato_realizado: { rotulo: 'Contato realizado', cor: 'green' },
  retornar_depois: { rotulo: 'Retornar depois', cor: 'yellow' },
  sem_resposta: { rotulo: 'Sem resposta', cor: 'gray' },
  sem_interesse: { rotulo: 'Sem interesse', cor: 'orange' },
  numero_invalido: { rotulo: 'Número inválido', cor: 'red' },
}
