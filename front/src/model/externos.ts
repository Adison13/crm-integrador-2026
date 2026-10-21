/**
 * Dados que a tela do CRM mostra, mas que não são do CRM. Cada um vem do seu dono e segue o
 * contrato dele em infra-integrador-2026/contratos/.
 */

/** StatusFinanceiro — GET /api/financeiro/empresas/status-financeiro?ids= (financeiro.yaml). */
export interface StatusFinanceiro {
  empresaId: string
  situacao: 'sem_cobranca' | 'ok' | 'atencao' | 'critico'
  cobrancasEmAtraso: number
  diasMaiorAtraso: number | null
  proximoVencimento: string | null
}

/** StatusContratual — GET /api/contratos/empresas/status-contratual?ids= (contratos.yaml). */
export interface StatusContratual {
  empresaId: string
  situacao: 'sem_contrato' | 'ok' | 'atencao' | 'critico'
  contratoId: string | null
  numero: string | null
  diasParaVencer: number | null
}

/** StatusTecnico — GET /api/chamados/empresas/status-tecnico?ids= (chamados.yaml). */
export interface StatusTecnico {
  empresaId: string
  status: 'ok' | 'atencao' | 'critico'
  chamadosAbertos: number
  criticosAbertos: number
  foraSla: number
  vencendo24h: number
  atualizadoEm: string
}

/**
 * Um dos três status da empresa que não ficam no CRM (Contrato §10.4), já pronto para a tela.
 * indisponivel: o dono não respondeu em 3 s ou falhou (§9.6); sem_permissao: o perfil não lê
 * o resumo daquele módulo, e a consulta nem é feita.
 */
export type StatusDeOutroModulo =
  | { rotulo: string; cor: 'green' | 'yellow' | 'red' | 'gray'; detalhe: string | null }
  | 'indisponivel'
  | 'sem_permissao'

export interface StatusExternos {
  financeiro: StatusDeOutroModulo
  contratual: StatusDeOutroModulo
  tecnico: StatusDeOutroModulo
}

/** UsuarioDaLista (identity.yaml), só com o que o CRM usa. */
export interface UsuarioDaLista {
  id: string
  nome: string
  email: string
  situacao: string
}

/** MembroDeEquipe — GET /api/identity/equipes/{id}/membros. */
export interface MembroDeEquipe {
  id: string
  nome: string
  lider: boolean
}

/** Quem pode aparecer como vendedor ou responsável na tela. */
export interface UsuarioResumo {
  id: string
  nome: string
}
