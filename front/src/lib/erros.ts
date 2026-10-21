import { ErroDaApi } from '@/plataforma/api'

export function mensagemDe(erro: unknown, padrao = 'Não foi possível concluir a operação.') {
  if (erro instanceof ErroDaApi && erro.status === 403) return 'Seu perfil não tem permissão para esta ação.'
  return erro instanceof Error && erro.message ? erro.message : padrao
}

/** Id do registro que já existe, devolvido no 409 de duplicidade (Contrato §10.3). */
export function idDoDuplicado(erro: unknown, chave: 'empresaId' | 'contatoId') {
  if (!(erro instanceof ErroDaApi) || erro.status !== 409) return null
  const dados = erro.envelope?.data
  if (dados && typeof dados === 'object' && chave in dados) {
    const id = (dados as Record<string, unknown>)[chave]
    return typeof id === 'string' ? id : null
  }
  return null
}

/**
 * Divide os erros do servidor entre os campos do formulário e o aviso geral. O que cita campo
 * que a tela não tem (o "id" do 409 de regra, um etapaId calculado) vai para o aviso geral,
 * junto com a mensagem do envelope — nenhum erro fica sem aparecer.
 */
export function separarErros(erro: unknown, campos: readonly string[]) {
  const porCampo: Record<string, string> = {}
  const fora: string[] = []
  if (erro instanceof ErroDaApi) {
    for (const e of erro.envelope?.errors ?? []) {
      if (campos.includes(e.campo)) porCampo[e.campo] = e.detalhe
      else fora.push(e.detalhe)
    }
  }
  const temGeral = erro != null && (Object.keys(porCampo).length === 0 || fora.length > 0)
  const geral = temGeral ? [...new Set([mensagemDe(erro), ...fora])].join(' ') : null
  return { porCampo, geral }
}
