import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EditarEmpresa, EmpresaDto, NovaEmpresa } from '@/model/empresa'
import { notificarCasca } from '@/plataforma/sessao'
import { somenteDigitos } from '@/lib/formato'
import { empresasService } from './empresas.service'
import { FILTRO_INICIAL, ORIGEM_DA_TELA, type TFiltroEmpresas, type TFormEmpresa } from './empresas.types'
import { statusExternosService } from './status-externos.service'

export const TAMANHO_DA_PAGINA = 20

export const empresasKeys = {
  todas: ['empresas'] as const,
  lista: (filtro: TFiltroEmpresas, pagina: number) => ['empresas', 'lista', filtro, pagina] as const,
  opcoes: ['empresas', 'opcoes'] as const,
  resumo: (ids: string[]) => ['empresas', 'resumo', ids] as const,
  detalhe: (id: string) => ['empresas', 'detalhe', id] as const,
  unidades: (id: string) => ['empresas', 'unidades', id] as const,
  statusExternos: (ids: string[]) => ['empresas', 'status-externos', ids] as const,
}

export function useEmpresas(filtro: TFiltroEmpresas, pagina: number) {
  return useQuery({
    queryKey: empresasKeys.lista(filtro, pagina),
    queryFn: () => empresasService.listar(filtro, pagina, TAMANHO_DA_PAGINA),
    // Ao trocar filtro ou página, a lista anterior fica na tela até a nova chegar
    placeholderData: keepPreviousData,
  })
}

/**
 * As primeiras 100 empresas por razão social (o máximo por página da API), para os selects de
 * outros formulários. Exige crm.empresa.ver; sem ela, a lista vem vazia.
 */
export function useOpcoesDeEmpresa(selecionada?: string) {
  const consulta = useQuery({
    queryKey: empresasKeys.opcoes,
    queryFn: async () => (await empresasService.listar(FILTRO_INICIAL, 0, 100)).itens,
  })
  const lista: Pick<EmpresaDto, 'id' | 'razaoSocial'>[] = consulta.data ?? []
  // A empresa já escolhida pode estar fora das 100 primeiras: entra pelo resumo, para o select não ficar em branco
  const foraDaLista = Boolean(selecionada) && consulta.isSuccess && !lista.some((e) => e.id === selecionada)
  const nomeDaSelecionada = useResumoDeEmpresas(foraDaLista && selecionada ? [selecionada] : [])
  const empresas = foraDaLista && selecionada
    ? [{ id: selecionada, razaoSocial: nomeDaSelecionada(selecionada) ?? 'Empresa selecionada' }, ...lista]
    : lista
  return { empresas, carregando: consulta.isPending, erro: consulta.error }
}

/**
 * Razão social das empresas que aparecem numa lista de outro recurso (oportunidades, contatos),
 * numa chamada só (§9.4). Exige só crm.empresa.ver_resumo, que todo perfil do CRM tem.
 */
export function useResumoDeEmpresas(ids: string[]) {
  const unicos = [...new Set(ids)].sort().slice(0, 100)
  const consulta = useQuery({
    queryKey: empresasKeys.resumo(unicos),
    queryFn: () => empresasService.resumo(unicos),
    enabled: unicos.length > 0,
  })
  const porId = new Map((consulta.data ?? []).map((e) => [e.id, e]))
  return (id: string | null | undefined) => (id ? porId.get(id)?.razaoSocial : undefined)
}

export function useEmpresa(id: string | undefined) {
  return useQuery({
    queryKey: empresasKeys.detalhe(id ?? ''),
    queryFn: () => empresasService.buscar(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useUnidades(id: string) {
  return useQuery({ queryKey: empresasKeys.unidades(id), queryFn: () => empresasService.unidades(id) })
}

export function useStatusExternos(ids: string[]) {
  return useQuery({
    queryKey: empresasKeys.statusExternos(ids),
    queryFn: () => statusExternosService.dasEmpresas(ids),
    enabled: ids.length > 0,
  })
}

// ------------------------------------------------------------------ formulário

export function formularioDe(empresa?: EmpresaDto): TFormEmpresa {
  return {
    razaoSocial: empresa?.razaoSocial ?? '',
    nomeFantasia: empresa?.nomeFantasia ?? '',
    cnpj: empresa?.cnpj ?? '',
    segmento: empresa?.segmento ?? '',
    porte: empresa?.porte ?? '',
    cidade: empresa?.cidade ?? '',
    estado: empresa?.estado ?? '',
    vendedorResponsavel: empresa?.vendedorResponsavel ?? '',
    statusComercial: empresa?.statusComercial ?? 'lead',
  }
}

/** As mesmas regras de NovaEmpresa/EditarEmpresa, para avisar antes de enviar. Quem decide é o servidor. */
export function validarEmpresa(form: TFormEmpresa): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.razaoSocial.trim()) erros.razaoSocial = 'Informe a razão social.'
  else if (form.razaoSocial.trim().length > 255) erros.razaoSocial = 'A razão social pode ter até 255 caracteres.'
  if (form.nomeFantasia.trim().length > 255) erros.nomeFantasia = 'O nome fantasia pode ter até 255 caracteres.'
  const cnpj = somenteDigitos(form.cnpj)
  if (cnpj && cnpj.length !== 14) erros.cnpj = 'O CNPJ deve ter 14 dígitos.'
  return erros
}

const ouNulo = (texto: string) => texto.trim() || null

function comuns(form: TFormEmpresa) {
  return {
    razaoSocial: form.razaoSocial.trim(),
    nomeFantasia: ouNulo(form.nomeFantasia),
    cnpj: ouNulo(somenteDigitos(form.cnpj)),
    segmento: ouNulo(form.segmento),
    porte: ouNulo(form.porte),
    cidade: ouNulo(form.cidade),
    estado: ouNulo(form.estado),
  }
}

/** Cria (sem id) ou edita a empresa, e recarrega toda consulta de empresas. */
export function useSalvarEmpresa() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }: { id?: string; form: TFormEmpresa }) => {
      if (!id) {
        const nova: NovaEmpresa = { ...comuns(form), ...ORIGEM_DA_TELA }
        return empresasService.criar(nova)
      }
      const edicao: EditarEmpresa = {
        ...comuns(form),
        vendedorResponsavel: ouNulo(form.vendedorResponsavel),
        statusComercial: form.statusComercial,
      }
      return empresasService.editar(id, edicao)
    },
    onSuccess: (_empresa, { id }) => {
      void cliente.invalidateQueries({ queryKey: empresasKeys.todas })
      // A prospecção lista as mesmas empresas em lead e prospect
      void cliente.invalidateQueries({ queryKey: ['prospeccao'] })
      notificarCasca('sucesso', id ? 'Empresa atualizada.' : 'Empresa criada.')
    },
  })
}
