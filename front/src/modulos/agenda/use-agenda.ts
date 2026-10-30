import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ReuniaoDto } from '@/model/atividade'
import { paraDataLocal, paraLocalDate } from '@/lib/formato'
import { agendaService } from './agenda.service'
import type { TIntervalo, TPeriodo } from './agenda.types'

/** Sob ['oportunidades']: reagendar, cancelar e registrar (use-atividades) já recarregam a agenda. */
export const agendaKeys = {
  periodo: ({ de, ate }: TIntervalo) => ['oportunidades', 'agenda', de, ate] as const,
}

export function useAgenda(intervalo: TIntervalo) {
  return useQuery({
    queryKey: agendaKeys.periodo(intervalo),
    queryFn: () => agendaService.reunioes(intervalo),
    placeholderData: keepPreviousData,
  })
}

/** A semana (segunda a domingo) ou o mês que contém a data — os dois dentro do limite de 62 dias. */
export function intervaloDe(periodo: TPeriodo, referencia: string): TIntervalo {
  const d = paraDataLocal(referencia)
  if (periodo === 'mes') {
    return { de: paraLocalDate(new Date(d.getFullYear(), d.getMonth(), 1)), ate: paraLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
  }
  const segunda = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
  return { de: paraLocalDate(segunda), ate: paraLocalDate(new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + 6)) }
}

/** Uma data do período anterior (-1) ou do seguinte (1). */
export function deslocar(periodo: TPeriodo, referencia: string, direcao: -1 | 1) {
  const d = paraDataLocal(referencia)
  return paraLocalDate(periodo === 'mes'
    ? new Date(d.getFullYear(), d.getMonth() + direcao, 1)
    : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * direcao))
}

/** Reuniões agrupadas pelo dia no fuso do navegador, mantendo a ordem de horário do back-end. */
export function porDia(reunioes: ReuniaoDto[]) {
  const dias = new Map<string, ReuniaoDto[]>()
  for (const r of reunioes) {
    const dia = paraLocalDate(new Date(r.dataHora))
    dias.set(dia, [...(dias.get(dia) ?? []), r])
  }
  return [...dias.entries()]
}
