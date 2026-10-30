import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { tarefasService } from './tarefas.service'
import type { TSituacaoTarefas } from './tarefas.types'

export const TAMANHO_DA_PAGINA = 20

/** Sob ['oportunidades']: concluir e editar (useConcluirTarefa, useSalvarTarefa) já recarregam a lista. */
export const tarefasKeys = {
  minhas: (situacao: TSituacaoTarefas, pagina: number) => ['oportunidades', 'minhas-tarefas', situacao, pagina] as const,
}

export function useMinhasTarefas(situacao: TSituacaoTarefas, pagina: number) {
  return useQuery({
    queryKey: tarefasKeys.minhas(situacao, pagina),
    queryFn: () => tarefasService.minhas(situacao, pagina, TAMANHO_DA_PAGINA),
    placeholderData: keepPreviousData,
  })
}
