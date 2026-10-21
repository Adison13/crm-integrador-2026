import { Mail, Pencil, Phone, SearchX, X } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar, Badge, Button, DetailField, DetailSection, EmptyState, Modal, Spinner } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { ContatoDto } from '@/model/contato'
import { ErroDaApi } from '@/plataforma/api'
import { dataHora, somenteDigitos, telefone } from '@/lib/formato'
import { useResumoDeEmpresas } from '../../empresas/use-empresas'
import { PAPEIS } from '../contatos.types'
import { useContato } from '../use-contatos'
import { IconePreferencia, SeloLgpd } from './canais'

interface Props {
  id: string
  aoFechar: () => void
  /** Ausente quando o perfil não tem crm.contato.editar. */
  aoEditar?: (contato: ContatoDto) => void
}

/** Detalhe do contato: modal sem padding com cabeçalho brand-950 (design system §5.2). */
export function ContatoDetalhe({ id, aoFechar, aoEditar }: Props) {
  const consulta = useContato(id)
  const contato = consulta.data
  const nomeDaEmpresa = useResumoDeEmpresas(contato ? [contato.empresaId] : [])

  return (
    <Modal open onClose={aoFechar} noPad size="lg" title={contato?.nome ?? 'Contato'}>
      {consulta.isPending && <Spinner className="min-h-60" />}
      {consulta.isError && (
        consulta.error instanceof ErroDaApi && consulta.error.status === 404
          ? <EmptyState icon={<SearchX aria-hidden />} title="Contato não encontrado" action={<Button variant="outline" onClick={aoFechar}>Fechar</Button>} />
          : <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
      )}
      {contato && (
        <>
          <div className="shrink-0 bg-brand-950 px-6 py-5 text-white">
            <div className="flex items-start gap-4">
              <Avatar nome={contato.nome} size="lg" tom="destaque" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold tracking-tight">{contato.nome}</h2>
                <p className="mt-0.5 text-xs text-brand-300">
                  {[contato.cargo, nomeDaEmpresa(contato.empresaId)].filter(Boolean).join(' · ') || 'Sem cargo informado'}
                </p>
                {contato.papel && <div className="mt-2"><Badge variant={PAPEIS[contato.papel].cor}>{PAPEIS[contato.papel].rotulo}</Badge></div>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {aoEditar && <Button variant="secondary" size="sm" onClick={() => aoEditar(contato)}><Pencil aria-hidden className="size-3.5" /> Editar</Button>}
                <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-900 hover:text-white">
                  <X aria-hidden className="size-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <DetailSection number={1} title="Contato">
              <DetailField label="E-mail">
                {contato.email && <a href={`mailto:${contato.email}`} className="inline-flex items-center gap-1.5 text-brand-700 hover:underline dark:text-brand-400"><Mail aria-hidden className="size-3.5" />{contato.email}</a>}
              </DetailField>
              <DetailField label="Telefone">
                {contato.telefone && <a href={`tel:+55${somenteDigitos(contato.telefone)}`} className="inline-flex items-center gap-1.5 text-brand-700 hover:underline dark:text-brand-400"><Phone aria-hidden className="size-3.5" />{telefone(contato.telefone)}</a>}
              </DetailField>
              <DetailField label="Empresa">
                {nomeDaEmpresa(contato.empresaId) && <Link to={`/empresas/${contato.empresaId}`} className="text-brand-700 hover:underline dark:text-brand-400">{nomeDaEmpresa(contato.empresaId)}</Link>}
              </DetailField>
              <DetailField label="Cargo">{contato.cargo}</DetailField>
            </DetailSection>

            <DetailSection number={2} title="Comunicação e LGPD">
              <DetailField label="Consentimento LGPD"><SeloLgpd consentimento={contato.consentimentoLgpd} comRotulo /></DetailField>
              <DetailField label="Canal preferido"><IconePreferencia preferencia={contato.preferenciaComunicacao} comRotulo /></DetailField>
            </DetailSection>

            <DetailSection number={3} title="Origem">
              <DetailField label="Origem do cadastro">{contato.origem && [contato.origem, contato.origemModuloId].filter(Boolean).join(' · ')}</DetailField>
              <DetailField label="Cadastrado em">{dataHora(contato.criadoEm)}</DetailField>
              <DetailField label="UTM source">{contato.utmSource}</DetailField>
              <DetailField label="UTM medium">{contato.utmMedium}</DetailField>
              <DetailField label="UTM campaign">{contato.utmCampaign}</DetailField>
            </DetailSection>
          </div>
        </>
      )}
    </Modal>
  )
}
