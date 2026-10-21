import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ContatoDto, NovoContato } from '@/model/contato'
import { notificarCasca } from '@/plataforma/sessao'
import { somenteDigitos } from '@/lib/formato'
import { contatosService } from './contatos.service'
import { ORIGEM_DA_TELA, type TFormContato } from './contatos.types'

export const TAMANHO_DA_PAGINA = 20

export const contatosKeys = {
  todos: ['contatos'] as const,
  daEmpresa: (empresaId: string, pagina: number, tamanho: number) => ['contatos', 'empresa', empresaId, pagina, tamanho] as const,
  /** Lista simples (sem página) para o detalhe da empresa e os selects. */
  opcoes: (empresaId: string) => ['contatos', 'empresa', empresaId, 'opcoes'] as const,
  detalhe: (id: string) => ['contatos', 'detalhe', id] as const,
}

/** Contatos de uma empresa, paginados — a listagem que o back-end oferece. */
export function useContatos(empresaId: string, pagina: number) {
  return useQuery({
    queryKey: contatosKeys.daEmpresa(empresaId, pagina, TAMANHO_DA_PAGINA),
    queryFn: () => contatosService.daEmpresa(empresaId, pagina, TAMANHO_DA_PAGINA),
    enabled: Boolean(empresaId),
    placeholderData: keepPreviousData,
  })
}

/** Até 100 contatos da empresa (máximo por página da API), para o detalhe e os selects. */
export function useContatosDaEmpresa(empresaId: string | null | undefined) {
  return useQuery({
    queryKey: contatosKeys.opcoes(empresaId ?? ''),
    queryFn: async () => (await contatosService.daEmpresa(empresaId ?? '', 0, 100)).itens,
    enabled: Boolean(empresaId),
  })
}

export function useContato(id: string | undefined) {
  return useQuery({
    queryKey: contatosKeys.detalhe(id ?? ''),
    queryFn: () => contatosService.buscar(id ?? ''),
    enabled: Boolean(id),
  })
}

// ------------------------------------------------------------------ formulário

export function formularioDe(contato?: ContatoDto, empresaId = ''): TFormContato {
  return {
    empresaId: contato?.empresaId ?? empresaId,
    nome: contato?.nome ?? '',
    cargo: contato?.cargo ?? '',
    email: contato?.email ?? '',
    telefone: contato?.telefone ?? '',
    papel: contato?.papel ?? '',
    consentimentoLgpd: contato?.consentimentoLgpd ?? '',
    preferenciaComunicacao: contato?.preferenciaComunicacao ?? '',
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** As mesmas regras de NovoContato, para avisar antes de enviar. */
export function validarContato(form: TFormContato): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.empresaId) erros.empresaId = 'Informe a empresa do contato.'
  if (!form.nome.trim()) erros.nome = 'Informe o nome.'
  else if (form.nome.trim().length > 255) erros.nome = 'O nome pode ter até 255 caracteres.'
  if (form.cargo.trim().length > 100) erros.cargo = 'O cargo pode ter até 100 caracteres.'
  if (form.email.trim() && !EMAIL.test(form.email.trim())) erros.email = 'Informe um e-mail válido.'
  if (somenteDigitos(form.telefone).length > 20) erros.telefone = 'O telefone pode ter até 20 caracteres.'
  return erros
}

const ouNulo = (texto: string) => texto.trim() || null

function paraNovoContato(form: TFormContato): NovoContato {
  return {
    empresaId: form.empresaId,
    nome: form.nome.trim(),
    cargo: ouNulo(form.cargo),
    email: ouNulo(form.email.toLowerCase()),
    telefone: ouNulo(somenteDigitos(form.telefone)),
    papel: form.papel || null,
    consentimentoLgpd: form.consentimentoLgpd || null,
    preferenciaComunicacao: form.preferenciaComunicacao || null,
    ...ORIGEM_DA_TELA,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  }
}

export function useSalvarContato() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }: { id?: string; form: TFormContato }) =>
      id ? contatosService.editar(id, paraNovoContato(form)) : contatosService.criar(paraNovoContato(form)),
    onSuccess: (_contato, { id }) => {
      void cliente.invalidateQueries({ queryKey: contatosKeys.todos })
      notificarCasca('sucesso', id ? 'Contato atualizado.' : 'Contato criado.')
    },
  })
}
