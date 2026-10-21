import { avisarTokenExpirado, definirSessaoDireta, sessaoAtual, type Usuario } from './sessao'

/** Envelope de toda resposta da plataforma (Contrato §8.2). */
export interface Envelope<T> {
  success: boolean
  data: T | null
  message: string | null
  errors: { campo: string; codigo: string; detalhe: string }[]
}

export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  total: number
}

/** Sem resposta do servidor: rede fora, serviço parado ou tempo esgotado. */
export const SEM_RESPOSTA = 0

function mensagemPadrao(status: number) {
  if (status === SEM_RESPOSTA) return 'Não foi possível falar com o servidor. Confira a conexão e tente de novo.'
  if (status >= 500) return 'O serviço não respondeu como esperado. Tente de novo em instantes.'
  if (status === 404) return 'Este recurso não está disponível no servidor.'
  return `A requisição falhou (HTTP ${status}).`
}

export class ErroDaApi extends Error {
  readonly status: number
  readonly envelope: Envelope<unknown> | null

  constructor(status: number, envelope: Envelope<unknown> | null) {
    super(envelope?.message ?? mensagemPadrao(status))
    this.status = status
    this.envelope = envelope
  }
}

export async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const cabecalhos = new Headers(opcoes.headers)
  const sessao = sessaoAtual()
  if (sessao) cabecalhos.set('Authorization', `Bearer ${sessao.token}`)
  if (opcoes.body && !cabecalhos.has('Content-Type')) cabecalhos.set('Content-Type', 'application/json')

  let resposta: Response
  try {
    resposta = await fetch(caminho, { ...opcoes, headers: cabecalhos })
  } catch {
    // Rede fora ou AbortSignal.timeout esgotado: o fetch não chega a ter resposta
    throw new ErroDaApi(SEM_RESPOSTA, null)
  }
  const envelope = (await resposta.json().catch(() => null)) as Envelope<T> | null

  if (resposta.status === 401) avisarTokenExpirado() // a casca renova e reenvia o token
  if (!resposta.ok || !envelope?.success) throw new ErroDaApi(resposta.status, envelope)
  return envelope.data as T
}

/** Corpo do login: a sessão aberta ou, com segundo fator ativo, o desafio (identity.yaml). */
type RespostaDoLogin =
  | { accessToken: string; usuario: Usuario & { tenantId: string } }
  | { desafio: string }

/** Só em modo direto. Embutido, quem faz login é a casca. */
export async function entrarComUsuarioDeTeste(email: string, senha: string) {
  const dados = await chamar<RespostaDoLogin>(
    '/api/identity/auth/login',
    { method: 'POST', body: JSON.stringify({ email, senha }), credentials: 'include' },
  )
  if ('desafio' in dados) {
    throw new Error('Este usuário tem verificação em duas etapas. Entre pela casca da plataforma.')
  }
  definirSessaoDireta({ token: dados.accessToken, tenantId: dados.usuario.tenantId, usuario: dados.usuario, tema: 'claro' })
}
