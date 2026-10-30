import type {
  StatusContratual, StatusDeOutroModulo, StatusExternos, StatusFinanceiro, StatusTecnico,
} from '@/model/externos'
import { chamar } from '@/plataforma/api'
import { PERMISSOES, temPermissao } from '@/plataforma/permissoes'
import { consulta } from '@/lib/consulta'

/** Timeout de toda chamada entre módulos (Contrato §9.6). */
const TEMPO_LIMITE = 3_000

const SITUACAO_FINANCEIRA: Record<StatusFinanceiro['situacao'], Exclude<StatusDeOutroModulo, string>> = {
  sem_cobranca: { rotulo: 'sem cobrança', cor: 'gray', detalhe: null },
  ok: { rotulo: 'em dia', cor: 'green', detalhe: null },
  atencao: { rotulo: 'atenção', cor: 'yellow', detalhe: null },
  critico: { rotulo: 'crítico', cor: 'red', detalhe: null },
}

const SITUACAO_CONTRATUAL: Record<StatusContratual['situacao'], Exclude<StatusDeOutroModulo, string>> = {
  sem_contrato: { rotulo: 'sem contrato', cor: 'gray', detalhe: null },
  ok: { rotulo: 'vigente', cor: 'green', detalhe: null },
  atencao: { rotulo: 'atenção', cor: 'yellow', detalhe: null },
  critico: { rotulo: 'crítico', cor: 'red', detalhe: null },
}

const SITUACAO_TECNICA: Record<StatusTecnico['status'], Exclude<StatusDeOutroModulo, string>> = {
  ok: { rotulo: 'ok', cor: 'green', detalhe: null },
  atencao: { rotulo: 'atenção', cor: 'yellow', detalhe: null },
  critico: { rotulo: 'crítico', cor: 'red', detalhe: null },
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

function financeiro(s: StatusFinanceiro): StatusDeOutroModulo {
  const detalhe = s.cobrancasEmAtraso > 0
    ? `${plural(s.cobrancasEmAtraso, 'cobrança em atraso', 'cobranças em atraso')}${s.diasMaiorAtraso ? `, a mais antiga há ${s.diasMaiorAtraso} dias` : ''}`
    : null
  return { ...SITUACAO_FINANCEIRA[s.situacao], detalhe }
}

function contratual(s: StatusContratual): StatusDeOutroModulo {
  const detalhe = [s.numero, s.diasParaVencer != null ? `vence em ${plural(s.diasParaVencer, 'dia', 'dias')}` : null].filter(Boolean).join(' · ')
  return { ...SITUACAO_CONTRATUAL[s.situacao], detalhe: detalhe || null }
}

function tecnico(s: StatusTecnico): StatusDeOutroModulo {
  const partes = [
    s.chamadosAbertos > 0 ? plural(s.chamadosAbertos, 'chamado aberto', 'chamados abertos') : null,
    s.criticosAbertos > 0 ? plural(s.criticosAbertos, 'crítico', 'críticos') : null,
    s.foraSla > 0 ? `${s.foraSla} fora do SLA` : null,
  ].filter(Boolean)
  return { ...SITUACAO_TECNICA[s.status], detalhe: partes.join(' · ') || null }
}

/**
 * Um dos três donos: sem a permissão de resumo, nem consulta; falha ou demora, "indisponível".
 * O erro de um não derruba os outros dois (§9.6, §10.4).
 */
async function doDono<T extends { empresaId: string }>(
  permissao: string, caminho: string, ids: string[], converter: (item: T) => StatusDeOutroModulo,
): Promise<Map<string, StatusDeOutroModulo> | 'indisponivel' | 'sem_permissao'> {
  if (!temPermissao(permissao)) return 'sem_permissao'
  try {
    const itens = await chamar<T[]>(caminho + consulta({ ids }), { signal: AbortSignal.timeout(TEMPO_LIMITE) })
    return new Map(itens.map((item) => [item.empresaId, converter(item)]))
  } catch {
    return 'indisponivel'
  }
}

/**
 * Status financeiro, contratual e técnico de até 100 empresas — uma consulta em lote em cada dono,
 * as três em paralelo (Contrato §9.4 e §10.4).
 */
export const statusExternosService = {
  async dasEmpresas(ids: string[]): Promise<Record<string, StatusExternos>> {
    const [fin, con, tec] = await Promise.all([
      doDono<StatusFinanceiro>(PERMISSOES.financeiroResumo, '/api/financeiro/empresas/status-financeiro', ids, financeiro),
      doDono<StatusContratual>(PERMISSOES.contratosResumo, '/api/contratos/empresas/status-contratual', ids, contratual),
      doDono<StatusTecnico>(PERMISSOES.chamadosResumo, '/api/chamados/empresas/status-tecnico', ids, tecnico),
    ])
    const de = (r: typeof fin, id: string): StatusDeOutroModulo => (typeof r === 'string' ? r : r.get(id) ?? 'indisponivel')
    return Object.fromEntries(ids.map((id) => [id, { financeiro: de(fin, id), contratual: de(con, id), tecnico: de(tec, id) }]))
  },
}
