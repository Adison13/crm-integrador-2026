/** Contrato de atividades, tarefas, reuniões e objeções, espelho do pacote atividade do back-end. */

export type TipoAtividade = 'ligacao' | 'email' | 'whatsapp' | 'visita' | 'outro'
export type TipoTarefa = TipoAtividade | 'reuniao' | 'follow_up'
export type StatusTarefa = 'pendente' | 'concluida'

/** AtividadeDto — o que já foi feito; não aceita data futura. */
export interface AtividadeDto {
  id: string
  oportunidadeId: string
  tipo: TipoAtividade
  descricao: string
  realizadaEm: string
  responsavelId: string | null
}

/** TarefaDto — vencida é calculado pelo servidor. */
export interface TarefaDto {
  id: string
  oportunidadeId: string | null
  descricao: string
  tipo: TipoTarefa | null
  responsavelId: string | null
  dataVencimento: string | null
  status: StatusTarefa
  vencida: boolean
  concluidaEm: string | null
  criadoEm: string
}

/** ReuniaoDto — registrada depois do registro pós-reunião. */
export interface ReuniaoDto {
  id: string
  oportunidadeId: string
  dataHora: string
  participantes: string | null
  localOuLink: string | null
  pauta: string | null
  registrada: boolean
  resumo: string | null
  proximoPasso: string | null
  registradaEm: string | null
}

/** ObjecaoDto. */
export interface ObjecaoDto {
  id: string
  oportunidadeId: string
  reuniaoId: string | null
  motivo: string
  criadoEm: string
}

/** NovaAtividade — POST /oportunidades/{id}/atividades. Sem data, vale agora; data futura é recusada. */
export interface NovaAtividade {
  tipo: TipoAtividade
  descricao: string
  realizadaEm: string | null
}

/** NovaTarefa — POST /tarefas. Sem responsável, fica com quem cria. */
export interface NovaTarefa {
  descricao: string
  tipo: TipoTarefa | null
  oportunidadeId: string | null
  responsavelId: string | null
  dataVencimento: string | null
}

/** EditarTarefa — PUT /tarefas/{id}. Repassar a outra pessoa exige crm.oportunidade.editar. */
export type EditarTarefa = Omit<NovaTarefa, 'oportunidadeId'>

/** NovaReuniao — POST /oportunidades/{id}/reunioes e PUT /reunioes/{id} (reagendar). */
export interface NovaReuniao {
  dataHora: string
  participantes: string | null
  localOuLink: string | null
  pauta: string | null
}

/**
 * RegistroReuniao — POST /reunioes/{id}/registro. Atualiza o próximo passo da oportunidade
 * (se aberta) e grava cada objeção, ligada à reunião. Até 20 objeções.
 */
export interface RegistroReuniao {
  resumo: string
  proximoPasso: string
  dataProximoPasso: string
  objecoes: string[]
}

/** NovaObjecao — POST /oportunidades/{id}/objecoes. */
export interface NovaObjecao {
  motivo: string
}

/** ObjecaoFrequenteDto — GET /objecoes/frequentes: os 20 motivos mais registrados no tenant. */
export interface ObjecaoFrequenteDto {
  motivo: string
  total: number
}
