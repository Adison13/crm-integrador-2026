/** Tipos de tela de Empresas: filtro, formulário e rótulos. O contrato fica em @/model/empresa. */
import type { StatusComercial, TipoUnidade } from '@/model/empresa'

/** Os filtros que GET /api/crm/empresas aceita. Busca por texto e porte ainda não existem lá. */
export interface TFiltroEmpresas {
  segmento: string
  status: StatusComercial | ''
}

export const FILTRO_INICIAL: TFiltroEmpresas = { segmento: '', status: '' }

/** Campos do formulário como o usuário digita; a conversão para NovaEmpresa/EditarEmpresa é no hook. */
export interface TFormEmpresa {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  segmento: string
  porte: string
  cidade: string
  estado: string
  vendedorResponsavel: string
  statusComercial: StatusComercial
}

/** Rótulo de exibição; também é a chave de cor do statusBadge. */
export const STATUS_COMERCIAL: Record<StatusComercial, string> = {
  lead: 'lead',
  prospect: 'prospect',
  cliente_ativo: 'cliente ativo',
  inativo: 'inativo',
}

/** O back-end aceita texto livre; a lista padroniza o que a tela oferece. */
export const SEGMENTOS = [
  'Agronegócio', 'Alimentício', 'Construção Civil', 'Educação', 'Hotelaria', 'Indústria', 'Logística',
  'Saúde', 'Serviços', 'Tecnologia', 'Varejo',
]

export const PORTES = ['Pequeno', 'Médio', 'Grande']

export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

export const TIPOS_DE_UNIDADE: Record<TipoUnidade, string> = {
  matriz: 'Matriz',
  filial: 'Filial',
  loja: 'Loja',
  escritorio: 'Escritório',
}

/** Origem gravada nas empresas criadas por esta tela (Contrato §10.3). */
export const ORIGEM_DA_TELA = { origem: 'crm', origemModuloId: 'cadastro-manual' }
