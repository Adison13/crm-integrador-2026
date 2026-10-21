import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, LoaderCircle } from 'lucide-react'
import { Input, Select, cx } from '@/components/ui'
import { PERMISSOES } from '@/plataforma/permissoes'
import { useAtraso } from '@/hooks/use-atraso'
import { usePermissoes } from '@/hooks/use-sessao'
import { mensagemDe } from '@/lib/erros'
import { buscaService } from '@/services/busca.service'
import { useOpcoesDeEmpresa, useResumoDeEmpresas } from '../use-empresas'

interface Props {
  id?: string
  valor: string
  aoMudar: (empresaId: string) => void
  /** Texto da opção vazia do select. */
  vazio?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Escolha de empresa para formulários e filtros. Quem tem crm.empresa.ver escolhe numa lista
 * (as 100 primeiras por razão social, GET /empresas). Quem só tem crm.empresa.ver_resumo — o
 * pré-vendas, que cria contato e oportunidade — procura pelo nome ou CNPJ em GET /busca.
 */
export function SeletorDeEmpresa(props: Props) {
  const { tem } = usePermissoes()
  return tem(PERMISSOES.empresaVer) ? <PorLista {...props} /> : <PorBusca {...props} />
}

function PorLista({ id, valor, aoMudar, vazio = 'Selecione...', disabled, invalid, className, 'aria-label': rotulo }: Props) {
  const { empresas, carregando, erro } = useOpcoesDeEmpresa(valor)
  return (
    <>
      <Select id={id} aria-label={rotulo} className={className} value={valor} disabled={disabled || carregando} invalid={invalid}
        onChange={(e) => aoMudar(e.target.value)}>
        <option value="">{carregando ? 'Carregando empresas…' : vazio}</option>
        {empresas.map((e) => <option key={e.id} value={e.id}>{e.razaoSocial}</option>)}
      </Select>
      {erro && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{mensagemDe(erro)}</p>}
    </>
  )
}

function PorBusca({ id, valor, aoMudar, disabled, invalid, className, 'aria-label': rotulo }: Props) {
  const [trocando, setTrocando] = useState(!valor)
  const [termo, setTermo] = useState('')
  const nome = useResumoDeEmpresas(valor ? [valor] : [])
  const q = useAtraso(termo.trim(), 250)
  const valido = q.length >= 2 && q.length <= 100
  const busca = useQuery({
    queryKey: ['busca', q],
    queryFn: ({ signal }) => buscaService.buscar(q, signal),
    enabled: valido && trocando,
    staleTime: 30_000,
  })
  // A busca mistura empresas e contatos; aqui só interessam as empresas
  const empresas = (busca.data ?? []).filter((r) => r.rota.startsWith('/empresas/'))

  if (valor && !trocando) {
    return (
      <div className={cx('flex h-9 items-center gap-2 rounded-lg border border-borda-forte bg-superficie px-3 text-sm', className)}>
        <Building2 aria-hidden className="size-4 shrink-0 text-texto-3" />
        <span className="min-w-0 flex-1 truncate text-texto">{nome(valor) ?? 'Carregando…'}</span>
        {!disabled && (
          <button type="button" onClick={() => setTrocando(true)} className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">
            Trocar
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cx('relative', className)}>
      <Input id={id} aria-label={rotulo} type="search" autoComplete="off" value={termo} disabled={disabled} invalid={invalid}
        placeholder="Digite o nome ou o CNPJ da empresa" onChange={(e) => setTermo(e.target.value)} />
      {valido && (
        <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-borda bg-superficie shadow-lg">
          {busca.isFetching && empresas.length === 0 && (
            <p role="status" className="flex items-center gap-2 px-3 py-2 text-sm text-texto-3"><LoaderCircle aria-hidden className="size-4 animate-spin" /> Buscando…</p>
          )}
          {busca.isError && <p role="alert" className="px-3 py-2 text-sm text-red-600 dark:text-red-400">{mensagemDe(busca.error)}</p>}
          {busca.isSuccess && empresas.length === 0 && <p className="px-3 py-2 text-sm text-texto-3">Nenhuma empresa encontrada.</p>}
          {empresas.length > 0 && (
            <ul aria-label="Empresas encontradas">
              {empresas.map((r) => (
                <li key={r.id}>
                  <button type="button" className="block w-full px-3 py-2 text-left hover:bg-superficie-2"
                    onClick={() => {
                      aoMudar(r.id)
                      setTermo('')
                      setTrocando(false)
                    }}>
                    <span className="block truncate text-sm font-medium text-titulo">{r.titulo}</span>
                    {r.subtitulo && <span className="block truncate text-xs text-texto-3">{r.subtitulo}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
