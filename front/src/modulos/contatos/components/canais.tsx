import { CircleCheck, Clock, Mail, MessageCircle, Phone, ShieldOff, TriangleAlert } from 'lucide-react'
import { cx } from '@/components/ui'
import type { ConsentimentoLgpd, PreferenciaComunicacao } from '@/model/contato'
import { CONSENTIMENTOS, PREFERENCIAS } from '../contatos.types'

const ICONE_DA_PREFERENCIA = { telefone: Phone, whatsapp: MessageCircle, email: Mail }

/** Ícone do canal preferido (lucide-react), com o nome para leitor de tela. */
export function IconePreferencia({ preferencia, comRotulo = false }: { preferencia: PreferenciaComunicacao | null; comRotulo?: boolean }) {
  if (!preferencia) return <span className="text-texto-3">—</span>
  const Icone = ICONE_DA_PREFERENCIA[preferencia]
  return (
    <span title={`Prefere ${PREFERENCIAS[preferencia]}`} className="inline-flex items-center gap-1 text-texto-2">
      <Icone aria-hidden className="size-4" />
      <span className={comRotulo ? 'text-xs' : 'sr-only'}>{PREFERENCIAS[preferencia]}</span>
    </span>
  )
}

const LGPD = {
  concedido: { icone: CircleCheck, cor: 'text-brand-700 dark:text-brand-400', curto: 'LGPD' },
  pendente: { icone: Clock, cor: 'text-yellow-700 dark:text-yellow-400', curto: 'Pendente' },
  revogado: { icone: TriangleAlert, cor: 'text-red-600 dark:text-red-400', curto: 'Sem consentimento' },
}

/** Situação do consentimento LGPD: verde concedido, amarelo pendente, vermelho revogado. */
export function SeloLgpd({ consentimento, comRotulo = false }: { consentimento: ConsentimentoLgpd | null; comRotulo?: boolean }) {
  if (!consentimento) {
    return (
      <span title="Consentimento não informado" className="inline-flex items-center gap-1 text-xs text-texto-3">
        <ShieldOff aria-hidden className="size-4" />
        <span className={comRotulo ? undefined : 'sr-only'}>Não informado</span>
      </span>
    )
  }
  const { icone: Icone, cor, curto } = LGPD[consentimento]
  return (
    <span title={`Consentimento LGPD: ${CONSENTIMENTOS[consentimento].toLowerCase()}`} className={cx('inline-flex items-center gap-1 text-xs font-medium', cor)}>
      <Icone aria-hidden className="size-4" />
      <span className={comRotulo ? undefined : 'sr-only'}>{comRotulo ? curto : CONSENTIMENTOS[consentimento]}</span>
    </span>
  )
}
