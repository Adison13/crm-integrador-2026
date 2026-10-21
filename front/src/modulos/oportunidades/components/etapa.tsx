import type { EtapaDto } from '@/model/funil'
import { COR_PADRAO } from '../../funil/funil.types'

/**
 * Nome da etapa com a sua cor. A cor é dado (EtapaDto.cor, escolhida pelo gestor), não tema —
 * por isso vem por style, e não por classe do Tailwind.
 */
export function NomeDaEtapa({ etapa }: { etapa: EtapaDto | undefined }) {
  if (!etapa) return <span className="text-texto-3">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: etapa.cor ?? COR_PADRAO }} />
      {etapa.nome}
    </span>
  )
}
