/** Tipos de tela do Funil. O contrato fica em @/model/funil. */

/** Etapa no modal Gerenciar Etapas: sem id, é nova; ausente da lista, é removida. */
export interface TEtapaEditavel {
  /** Chave local da linha, estável enquanto o modal está aberto. */
  chave: string
  id?: string
  nome: string
  cor: string
}

/** Paleta das etapas — a cor fica gravada na etapa como #RRGGBB (NovaEtapa.cor). */
export const CORES_DE_ETAPA = ['#6B7280', '#2563EB', '#0891B2', '#0E9F8E', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#DB2777']

export const COR_PADRAO = '#6B7280'
