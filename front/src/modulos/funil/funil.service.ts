import type { EditarFunil, EtapaDto, FunilDto, NovaEtapa, NovoFunil, OrdemEtapas } from '@/model/funil'
import { chamar } from '@/plataforma/api'
import { corpo } from '@/lib/consulta'
import type { TEtapaEditavel } from './funil.types'

/** Funis e etapas (FunilController). */
export const funilService = {
  /** Exige crm.funil.ver. O back-end cria o funil padrão no primeiro acesso do tenant. */
  listar() {
    return chamar<FunilDto[]>('/api/crm/funis')
  },

  /** Exige crm.funil.administrar. Nasce com ao menos uma etapa e não é o padrão. */
  criar(dados: NovoFunil) {
    return chamar<FunilDto>('/api/crm/funis', { method: 'POST', body: corpo(dados) })
  },

  /** padrao true faz deste o funil padrão do tenant (o anterior deixa de ser). */
  editar(id: string, dados: EditarFunil) {
    return chamar<FunilDto>(`/api/crm/funis/${id}`, { method: 'PUT', body: corpo(dados) })
  },

  /** O padrão não sai (409 FUNIL_PADRAO), nem funil com oportunidades (409 FUNIL_COM_OPORTUNIDADES). */
  excluir(id: string) {
    return chamar<void>(`/api/crm/funis/${id}`, { method: 'DELETE' })
  },

  /**
   * Aplica o que mudou no modal Gerenciar Etapas (exige crm.funil.administrar). Não há rota que
   * grave tudo de uma vez, então são várias chamadas, nesta ordem:
   *   1. DELETE /etapas/{id} das removidas — primeiro, porque o 409 mais comum
   *      (ETAPA_COM_OPORTUNIDADES) para tudo antes de qualquer outra mudança;
   *   2. PUT    /etapas/{id} das renomeadas ou com outra cor;
   *   3. POST   /funis/{id}/etapas das novas (entram no fim);
   *   4. PUT    /funis/{id}/etapas/ordem com todas, na ordem da tela.
   * Se o funil ficaria sem etapa no passo 1 (ULTIMA_ETAPA), as novas são criadas antes.
   * Uma falha no meio deixa aplicado o que já foi: a tela relê o funil e mostra o erro.
   */
  async salvarEtapas(funil: FunilDto, etapas: TEtapaEditavel[]): Promise<void> {
    const mantidas = new Set(etapas.flatMap((e) => (e.id ? [e.id] : [])))
    const removidas = funil.etapas.filter((e) => !mantidas.has(e.id))
    const alteradas = etapas.filter((e) => {
      const original = funil.etapas.find((o) => o.id === e.id)
      return original && (original.nome !== e.nome.trim() || (original.cor ?? '') !== e.cor)
    })
    const novas = etapas.filter((e) => !e.id)
    const idDa = new Map(etapas.flatMap((e) => (e.id ? [[e.chave, e.id] as const] : [])))

    async function criarNovas() {
      for (const nova of novas) {
        const criada = await chamar<EtapaDto>(`/api/crm/funis/${funil.id}/etapas`, {
          method: 'POST', body: corpo({ nome: nova.nome.trim(), cor: nova.cor } satisfies NovaEtapa),
        })
        idDa.set(nova.chave, criada.id)
      }
    }

    const ficariaVazio = removidas.length === funil.etapas.length
    if (ficariaVazio) await criarNovas()
    for (const etapa of removidas) await chamar<void>(`/api/crm/etapas/${etapa.id}`, { method: 'DELETE' })
    for (const etapa of alteradas) {
      await chamar<EtapaDto>(`/api/crm/etapas/${etapa.id}`, {
        method: 'PUT', body: corpo({ nome: etapa.nome.trim(), cor: etapa.cor } satisfies NovaEtapa),
      })
    }
    if (!ficariaVazio) await criarNovas()

    // Depois dos passos acima o back-end tem as que ficaram, renumeradas, e as novas no fim
    const noServidor = [...funil.etapas.filter((e) => mantidas.has(e.id)).map((e) => e.id), ...novas.map((e) => idDa.get(e.chave))]
    const ordem: OrdemEtapas = { etapaIds: etapas.map((e) => idDa.get(e.chave) ?? '') }
    if (ordem.etapaIds.some((id, i) => noServidor[i] !== id)) {
      await chamar<FunilDto>(`/api/crm/funis/${funil.id}/etapas/ordem`, { method: 'PUT', body: corpo(ordem) })
    }
  },
}
