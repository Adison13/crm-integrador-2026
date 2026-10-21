import type { MembroDeEquipe, UsuarioDaLista, UsuarioResumo } from '@/model/externos'
import { chamar, type Pagina } from '@/plataforma/api'
import { PERMISSOES, equipesDaSessao, temPermissao } from '@/plataforma/permissoes'
import { sessaoAtual } from '@/plataforma/sessao'

/** Timeout de toda chamada entre módulos (Contrato §9.6). */
const TEMPO_LIMITE = 3_000

/**
 * Usuários do tenant que a tela consegue nomear — vendedores e responsáveis. Quem responde é o
 * identity, e o que cada perfil enxerga depende da permissão:
 *   identity.usuario.ver        GET /api/identity/usuarios?situacao=ativo   (administrador, gestor)
 *   identity.equipe.ver_resumo  GET /api/identity/equipes/{id}/membros      (equipes do token)
 * O próprio usuário da sessão entra sempre. Id fora dessa lista aparece como "Outro usuário".
 */
export const usuariosService = {
  async listar(): Promise<UsuarioResumo[]> {
    const porId = new Map<string, UsuarioResumo>()
    const sessao = sessaoAtual()
    if (sessao) porId.set(sessao.usuario.id, { id: sessao.usuario.id, nome: sessao.usuario.nome })

    if (temPermissao(PERMISSOES.usuarioVer)) {
      // Identity fora do ar ou lento não derruba a tela: fica só o nome de quem está na sessão (§9.6)
      const pagina = await chamar<Pagina<UsuarioDaLista>>('/api/identity/usuarios?situacao=ativo&tamanho=100&ordenar=nome,asc',
        { signal: AbortSignal.timeout(TEMPO_LIMITE) }).catch(() => null)
      pagina?.itens.forEach((u) => porId.set(u.id, { id: u.id, nome: u.nome }))
    } else if (temPermissao(PERMISSOES.equipeResumo)) {
      const equipes = await Promise.allSettled(
        equipesDaSessao().map((id) => chamar<MembroDeEquipe[]>(`/api/identity/equipes/${id}/membros`, { signal: AbortSignal.timeout(TEMPO_LIMITE) })),
      )
      equipes.forEach((r) => r.status === 'fulfilled' && r.value.forEach((m) => porId.set(m.id, { id: m.id, nome: m.nome })))
    }

    return [...porId.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  },
}
