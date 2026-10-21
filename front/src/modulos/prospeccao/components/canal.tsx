import { Linkedin, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { CanalTentativa } from '@/model/prospeccao'
import { CANAIS } from '../prospeccao.types'

const ICONES = { telefone: Phone, email: Mail, whatsapp: MessageCircle, linkedin: Linkedin, visita: MapPin }

export function IconeDoCanal({ canal }: { canal: CanalTentativa }) {
  const Icone = ICONES[canal]
  return (
    <span title={CANAIS[canal]} className="inline-flex text-texto-3">
      <Icone aria-hidden className="size-4" />
      <span className="sr-only">{CANAIS[canal]}</span>
    </span>
  )
}
