import { sessaoAtual } from './sessao'

/** Claims do token que a tela usa (Contrato §4.2). */
interface Claims {
  perms?: string[]
  equipes?: string[]
}

let ultimo: { token: string; claims: Claims } | null = null

/**
 * Lê o payload do JWT sem validar a assinatura — quem valida é o back-end. Serve só para a tela
 * esconder o que o perfil não pode fazer: esconder é usabilidade, não segurança, e o back-end
 * continua respondendo 403 (modulos/README.md).
 */
export function claimsDo(token: string): Claims {
  if (ultimo?.token === token) return ultimo.claims
  let claims: Claims = {}
  try {
    const payload = token.split('.')[1] ?? ''
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)))
    claims = JSON.parse(json) as Claims
  } catch {
    // Token ilegível: nenhuma permissão na tela; o back-end decide de qualquer forma
  }
  ultimo = { token, claims }
  return claims
}

export function temPermissao(permissao: string) {
  const sessao = sessaoAtual()
  return sessao ? (claimsDo(sessao.token).perms ?? []).includes(permissao) : false
}

export function equipesDaSessao() {
  const sessao = sessaoAtual()
  return sessao ? claimsDo(sessao.token).equipes ?? [] : []
}

/** Permissões que as telas consultam — as mesmas do @PreAuthorize dos controllers. */
export const PERMISSOES = {
  empresaVer: 'crm.empresa.ver',
  empresaCriar: 'crm.empresa.criar',
  empresaEditar: 'crm.empresa.editar',
  contatoVer: 'crm.contato.ver',
  contatoCriar: 'crm.contato.criar',
  contatoEditar: 'crm.contato.editar',
  funilVer: 'crm.funil.ver',
  funilAdministrar: 'crm.funil.administrar',
  oportunidadeVer: 'crm.oportunidade.ver',
  oportunidadeCriar: 'crm.oportunidade.criar',
  oportunidadeEditar: 'crm.oportunidade.editar',
  prospeccaoVer: 'crm.prospeccao.ver',
  prospeccaoRegistrar: 'crm.prospeccao.registrar',
  // De outros módulos (Contrato §10.4) e do identity
  financeiroResumo: 'financeiro.cobranca.ver_resumo',
  contratosResumo: 'contratos.contrato.ver_resumo',
  chamadosResumo: 'chamados.empresa.ver_resumo',
  usuarioVer: 'identity.usuario.ver',
  equipeResumo: 'identity.equipe.ver_resumo',
} as const
