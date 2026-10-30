import { Badge } from '@/components/ui'
import type { StatusDeOutroModulo } from '@/model/externos'

const NEUTRO = 'inline-flex items-center rounded-full border border-dashed border-borda-forte px-2 py-0.5 text-xs font-medium whitespace-nowrap text-texto-3'

/**
 * Um dos status que vêm de outro módulo (§10.4). Dono fora do ar fica "indisponível" e o resto
 * da linha aparece normalmente (§9.6); perfil sem o resumo daquele módulo vê só um traço.
 */
export function StatusExterno({ valor, carregando, dono }: { valor: StatusDeOutroModulo | undefined; carregando: boolean; dono: string }) {
  if (carregando || valor === undefined) {
    return <span aria-label="Carregando" className="inline-block h-5 w-16 animate-pulse rounded-full bg-superficie-2" />
  }
  if (valor === 'indisponivel') return <span title={`O módulo ${dono} não respondeu`} className={NEUTRO}>indisponível</span>
  if (valor === 'sem_permissao') {
    return <span title={`Seu perfil não vê o status do ${dono}`} className="text-texto-3">—<span className="sr-only">sem acesso ao {dono}</span></span>
  }
  return (
    <span title={valor.detalhe ?? undefined}>
      <Badge variant={valor.cor}>{valor.rotulo}</Badge>
    </span>
  )
}
