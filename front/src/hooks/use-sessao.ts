import { useSyncExternalStore } from 'react'
import { claimsDo } from '@/plataforma/permissoes'
import { aoMudarSessao, sessaoAtual } from '@/plataforma/sessao'

/** A sessão atual, relida a cada plataforma:sessao, plataforma:token ou login em modo direto. */
export function useSessao() {
  return useSyncExternalStore(aoMudarSessao, sessaoAtual)
}

/** Permissões do token da sessão — para esconder o que o perfil não pode fazer. */
export function usePermissoes() {
  const sessao = useSessao()
  const perms = new Set(sessao ? claimsDo(sessao.token).perms ?? [] : [])
  return { tem: (permissao: string) => perms.has(permissao) }
}
