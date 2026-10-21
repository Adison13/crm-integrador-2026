import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ConverterEmpresa, NovaTentativa } from '@/model/prospeccao'
import { notificarCasca } from '@/plataforma/sessao'
import { deCampoDataHora } from '@/lib/formato'
import { prospeccaoService } from './prospeccao.service'
import type { TFiltroProspeccao, TFormTentativa } from './prospeccao.types'

export const TAMANHO_DA_PAGINA = 20

export const prospeccaoKeys = {
  todas: ['prospeccao'] as const,
  lista: (filtro: TFiltroProspeccao, pagina: number) => ['prospeccao', 'lista', filtro, pagina] as const,
  tentativas: (empresaId: string) => ['prospeccao', 'tentativas', empresaId] as const,
}

export function useProspeccao(filtro: TFiltroProspeccao, pagina: number) {
  return useQuery({
    queryKey: prospeccaoKeys.lista(filtro, pagina),
    queryFn: () => prospeccaoService.listar(filtro, pagina, TAMANHO_DA_PAGINA),
    placeholderData: keepPreviousData,
  })
}

export function useTentativas(empresaId: string) {
  return useQuery({ queryKey: prospeccaoKeys.tentativas(empresaId), queryFn: () => prospeccaoService.tentativas(empresaId) })
}

export function validarTentativa(form: TFormTentativa): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.canal) erros.canal = 'Informe o canal da tentativa.'
  if (!form.resultado) erros.resultado = 'Informe o resultado da tentativa.'
  if (form.observacao.length > 1000) erros.observacao = 'A observação pode ter até 1000 caracteres.'
  if (form.realizadaEm && new Date(form.realizadaEm).getTime() > Date.now() + 5 * 60_000) {
    erros.realizadaEm = 'A tentativa registra um contato já feito; para o futuro, crie uma tarefa.'
  }
  return erros
}

function paraNovaTentativa(form: TFormTentativa): NovaTentativa {
  if (!form.canal || !form.resultado) throw new Error('Formulário de tentativa incompleto.')
  return {
    canal: form.canal,
    resultado: form.resultado,
    contatoId: form.contatoId || null,
    observacao: form.observacao.trim() || null,
    realizadaEm: deCampoDataHora(form.realizadaEm),
  }
}

export function useRegistrarTentativa() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ empresaId, form }: { empresaId: string; form: TFormTentativa }) =>
      prospeccaoService.registrar(empresaId, paraNovaTentativa(form)),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: prospeccaoKeys.todas })
      notificarCasca('sucesso', 'Tentativa registrada.')
    },
  })
}

export function useExcluirTentativa() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => prospeccaoService.excluirTentativa(id),
    onSuccess: () => {
      // Muda o total e a última tentativa da lista
      void cliente.invalidateQueries({ queryKey: prospeccaoKeys.todas })
      notificarCasca('sucesso', 'Tentativa excluída.')
    },
  })
}

export function useConverterEmpresa() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ empresaId, dados }: { empresaId: string; dados: ConverterEmpresa }) => prospeccaoService.converter(empresaId, dados),
    onSuccess: () => {
      // A empresa muda de status e nasce uma oportunidade no funil padrão
      for (const chave of [['prospeccao'], ['empresas'], ['oportunidades']]) void cliente.invalidateQueries({ queryKey: chave })
      notificarCasca('sucesso', 'Oportunidade criada no funil padrão.')
    },
  })
}
