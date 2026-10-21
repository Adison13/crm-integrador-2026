import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EditarOportunidade, MoverOportunidade, OportunidadeDto } from '@/model/oportunidade'
import { notificarCasca } from '@/plataforma/sessao'
import { numeroDe, valorParaCampo } from '@/lib/formato'
import { oportunidadesService } from './oportunidades.service'
import { FILTRO_INICIAL, type TFiltroOportunidades, type TFormOportunidade } from './oportunidades.types'

export const TAMANHO_DA_PAGINA = 20

export const oportunidadesKeys = {
  todas: ['oportunidades'] as const,
  lista: (filtro: TFiltroOportunidades, pagina: number, tamanho: number) => ['oportunidades', 'lista', filtro, pagina, tamanho] as const,
  detalhe: (id: string) => ['oportunidades', 'detalhe', id] as const,
}

export function useOportunidades(filtro: TFiltroOportunidades, pagina: number, tamanho = TAMANHO_DA_PAGINA) {
  return useQuery({
    queryKey: oportunidadesKeys.lista(filtro, pagina, tamanho),
    queryFn: () => oportunidadesService.listar(filtro, pagina, tamanho),
    placeholderData: keepPreviousData,
  })
}

/** Abertas de um funil, até 100 (o máximo por página da API) — o quadro do funil. */
export function useOportunidadesDoFunil(funilId: string | undefined) {
  return useQuery({
    queryKey: oportunidadesKeys.lista({ ...FILTRO_INICIAL, funilId: funilId ?? '', status: 'aberta' }, 0, 100),
    queryFn: async () => (await oportunidadesService.listar({ ...FILTRO_INICIAL, funilId: funilId ?? '', status: 'aberta' }, 0, 100)).itens,
    enabled: Boolean(funilId),
  })
}

/** Todas as oportunidades de uma empresa, abertas e fechadas, para o detalhe da empresa. */
export function useOportunidadesDaEmpresa(empresaId: string) {
  const filtro = { ...FILTRO_INICIAL, status: '' as const, empresaId, ordenar: 'criadoEm,desc' as const }
  return useQuery({
    queryKey: oportunidadesKeys.lista(filtro, 0, 100),
    queryFn: async () => (await oportunidadesService.listar(filtro, 0, 100)).itens,
  })
}

export function useOportunidade(id: string | undefined) {
  return useQuery({
    queryKey: oportunidadesKeys.detalhe(id ?? ''),
    queryFn: () => oportunidadesService.buscar(id ?? ''),
    enabled: Boolean(id),
  })
}

// ------------------------------------------------------------------ formulário

export function formularioDe(o?: OportunidadeDto, inicial: Partial<TFormOportunidade> = {}): TFormOportunidade {
  return {
    titulo: o?.titulo ?? '',
    empresaId: o?.empresaId ?? '',
    contatoId: o?.contatoId ?? '',
    etapaId: o?.etapaId ?? '',
    tipo: o?.tipo ?? 'nova',
    valorImplantacao: valorParaCampo(o?.valorImplantacao),
    valorMrr: valorParaCampo(o?.valorMrr),
    probabilidade: o?.probabilidade == null ? '' : String(o.probabilidade),
    dataPrevistaFechamento: o?.dataPrevistaFechamento ?? '',
    proximoPasso: o?.proximoPasso ?? '',
    dataProximoPasso: o?.dataProximoPasso ?? '',
    responsavelId: o?.responsavelId ?? '',
    ...inicial,
  }
}

function validarDinheiro(texto: string, rotulo: string) {
  const valor = numeroDe(texto)
  if (valor === null) return null
  if (Number.isNaN(valor)) return `Informe ${rotulo} em reais, como 48.000,00.`
  if (Number(valor.toFixed(2)) !== valor) return 'Informe o valor com até 2 casas decimais.'
  return null
}

/** As regras de NovaOportunidade e de OportunidadeServico.validar, para avisar antes de enviar. */
export function validarOportunidade(form: TFormOportunidade, { exigeEmpresa = true } = {}): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!form.titulo.trim()) erros.titulo = 'Informe o título da oportunidade.'
  else if (form.titulo.trim().length > 255) erros.titulo = 'O título pode ter até 255 caracteres.'
  if (exigeEmpresa && !form.empresaId) erros.empresaId = 'Informe a empresa.'
  const implantacao = validarDinheiro(form.valorImplantacao, 'o valor de implantação')
  if (implantacao) erros.valorImplantacao = implantacao
  const mrr = validarDinheiro(form.valorMrr, 'o MRR')
  if (mrr) erros.valorMrr = mrr
  if (form.probabilidade.trim()) {
    const p = Number(form.probabilidade)
    if (!Number.isInteger(p) || p < 0 || p > 100) erros.probabilidade = 'A probabilidade vai de 0 a 100.'
  }
  if (!form.proximoPasso.trim()) erros.proximoPasso = 'Oportunidade aberta precisa de próximo passo (RF-CRM-03).'
  else if (form.proximoPasso.trim().length > 255) erros.proximoPasso = 'O próximo passo pode ter até 255 caracteres.'
  if (!form.dataProximoPasso) erros.dataProximoPasso = 'Informe a data do próximo passo.'
  return erros
}

const ouNulo = (texto: string) => texto.trim() || null

/** Campos comerciais, comuns à criação, à edição e à conversão da prospecção. */
export function dadosComerciais(form: TFormOportunidade) {
  return {
    titulo: form.titulo.trim(),
    contatoId: ouNulo(form.contatoId),
    produtoId: null,
    valorImplantacao: numeroDe(form.valorImplantacao),
    valorMrr: numeroDe(form.valorMrr),
    probabilidade: form.probabilidade.trim() ? Number(form.probabilidade) : null,
    dataPrevistaFechamento: ouNulo(form.dataPrevistaFechamento),
    proximoPasso: ouNulo(form.proximoPasso),
    dataProximoPasso: ouNulo(form.dataProximoPasso),
    responsavelId: ouNulo(form.responsavelId),
  }
}

function paraEdicao(form: TFormOportunidade): EditarOportunidade {
  return { ...dadosComerciais(form), empresaId: form.empresaId, unidadeId: null, tipo: form.tipo }
}

function useInvalidarOportunidades() {
  const cliente = useQueryClient()
  return () => void cliente.invalidateQueries({ queryKey: oportunidadesKeys.todas })
}

export function useSalvarOportunidade() {
  const invalidar = useInvalidarOportunidades()
  return useMutation({
    mutationFn: ({ id, form }: { id?: string; form: TFormOportunidade }) =>
      id
        ? oportunidadesService.editar(id, paraEdicao(form))
        : oportunidadesService.criar({ ...paraEdicao(form), etapaId: ouNulo(form.etapaId), origem: 'crm', origemModuloId: null }),
    onSuccess: (_o, { id }) => {
      invalidar()
      notificarCasca('sucesso', id ? 'Oportunidade salva.' : 'Oportunidade criada.')
    },
  })
}

export function useMoverOportunidade() {
  const invalidar = useInvalidarOportunidades()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: MoverOportunidade }) => oportunidadesService.mover(id, dados),
    onSuccess: invalidar,
    onError: (erro) => notificarCasca('erro', erro instanceof Error ? erro.message : 'Não foi possível mover a oportunidade.'),
  })
}

export function useGanharOportunidade() {
  const invalidar = useInvalidarOportunidades()
  return useMutation({
    mutationFn: (id: string) => oportunidadesService.ganhar(id),
    onSuccess: () => {
      invalidar()
      notificarCasca('sucesso', 'Oportunidade ganha. Contratos e Financeiro foram avisados.')
    },
  })
}

export function usePerderOportunidade() {
  const invalidar = useInvalidarOportunidades()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => oportunidadesService.perder(id, { motivo }),
    onSuccess: () => {
      invalidar()
      notificarCasca('info', 'Oportunidade marcada como perdida.')
    },
  })
}
