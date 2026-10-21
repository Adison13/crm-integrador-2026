import { useState, type FormEvent } from 'react'
import { Button, FormField, Input } from '@/components/ui'
import { mensagemDe } from '@/lib/erros'
import { ErroDaApi, SEM_RESPOSTA, entrarComUsuarioDeTeste } from '@/plataforma/api'

function mensagemDoLogin(erro: unknown) {
  if (erro instanceof ErroDaApi && erro.status === SEM_RESPOSTA) {
    return 'O gateway não respondeu. Suba a infraestrutura do infra-integrador-2026 e tente de novo.'
  }
  return mensagemDe(erro, 'Não foi possível entrar.')
}

/**
 * Modo direto, só para desenvolvimento: login com um usuário de docs/usuarios-de-teste.md
 * (Contrato §12 e checklist item 11 — o front roda sozinho e dentro do iframe). Dentro da casca
 * este passo não existe: a sessão chega por postMessage. Menu, cabeçalho e busca são da casca.
 */
export function EntradaDeTeste() {
  const [email, setEmail] = useState('administrador@empresa-a.dev')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await entrarComUsuarioDeTeste(email.trim(), senha)
    } catch (e) {
      setErro(mensagemDoLogin(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <p className="font-mono text-xs tracking-widest text-texto-3 uppercase">Modo direto · desenvolvimento</p>
      <h1 className="mt-2 text-xl font-bold text-titulo">Entrar com usuário de teste</h1>
      <p className="mt-1 text-sm text-texto-3">Dentro da plataforma, este passo não existe: a casca entrega a sessão.</p>
      <form onSubmit={entrar} className="mt-6 grid gap-3">
        <FormField label="E-mail" htmlFor="email">
          <Input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Senha" htmlFor="senha" hint="Usuários e senha em docs/usuarios-de-teste.md do infra.">
          <Input id="senha" type="password" required autoComplete="current-password" autoFocus value={senha} onChange={(e) => setSenha(e.target.value)} />
        </FormField>
        {erro && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
        <Button type="submit" loading={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </main>
  )
}
