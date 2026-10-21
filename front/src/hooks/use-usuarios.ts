import { useQuery } from '@tanstack/react-query'
import { usuariosService } from '@/services/usuarios.service'
import { useSessao } from './use-sessao'

export const usuariosKeys = { todos: (usuarioId: string) => ['usuarios', usuarioId] as const }

/**
 * Usuários que o perfil consegue nomear e o nome por id. Sem id, nulo; id que o identity não
 * devolveu para este perfil, "Outro usuário" — o responsável existe, só não é visível aqui.
 */
export function useUsuarios() {
  const sessao = useSessao()
  const consulta = useQuery({
    queryKey: usuariosKeys.todos(sessao?.usuario.id ?? ''),
    queryFn: usuariosService.listar,
    staleTime: 30 * 60_000,
    enabled: Boolean(sessao),
  })
  const porId = new Map((consulta.data ?? []).map((u) => [u.id, u.nome]))
  const usuarios = consulta.data ?? []
  return {
    usuarios,
    nome: (id: string | null | undefined) => (id ? porId.get(id) ?? (consulta.isPending ? null : 'Outro usuário') : null),
    /**
     * Opções de um select de responsável. Quem já está escolhido continua na lista mesmo fora do
     * que o perfil enxerga — senão o select mostraria "sem responsável" e enganaria quem edita.
     */
    opcoes: (selecionado: string | null | undefined) =>
      selecionado && !porId.has(selecionado) ? [{ id: selecionado, nome: 'Outro usuário (atual)' }, ...usuarios] : usuarios,
  }
}
