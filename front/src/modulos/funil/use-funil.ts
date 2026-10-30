import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FunilDto } from '@/model/funil'
import { notificarCasca } from '@/plataforma/sessao'
import { funilService } from './funil.service'
import type { TEtapaEditavel } from './funil.types'

export const funilKeys = { todos: ['funis'] as const }

export function useFunis() {
  return useQuery({ queryKey: funilKeys.todos, queryFn: funilService.listar })
}

export function useSalvarEtapas() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ funil, etapas }: { funil: FunilDto; etapas: TEtapaEditavel[] }) => funilService.salvarEtapas(funil, etapas),
    onSuccess: () => notificarCasca('sucesso', 'Etapas do funil salvas.'),
    // Também na falha: parte das chamadas pode já ter sido aplicada
    onSettled: () => cliente.invalidateQueries({ queryKey: funilKeys.todos }),
  })
}

function useInvalidarFunis() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: funilKeys.todos })
}

export function useCriarFunil() {
  const invalidar = useInvalidarFunis()
  return useMutation({
    mutationFn: ({ nome, etapas }: { nome: string; etapas: TEtapaEditavel[] }) =>
      funilService.criar({ nome: nome.trim(), etapas: etapas.map((e) => ({ nome: e.nome.trim(), cor: e.cor })) }),
    onSuccess: () => {
      void invalidar()
      notificarCasca('sucesso', 'Funil criado.')
    },
  })
}

export function useEditarFunil() {
  const invalidar = useInvalidarFunis()
  return useMutation({
    mutationFn: ({ id, nome, padrao }: { id: string; nome: string; padrao: boolean }) =>
      funilService.editar(id, { nome: nome.trim(), padrao }),
    onSuccess: () => {
      void invalidar()
      notificarCasca('sucesso', 'Funil salvo.')
    },
  })
}

export function useExcluirFunil() {
  const invalidar = useInvalidarFunis()
  return useMutation({
    mutationFn: (id: string) => funilService.excluir(id),
    onSuccess: () => {
      void invalidar()
      notificarCasca('sucesso', 'Funil excluído.')
    },
  })
}
