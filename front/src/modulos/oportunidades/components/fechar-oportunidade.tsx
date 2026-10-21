import { useState } from 'react'
import { Button, FormField, Modal, Textarea } from '@/components/ui'
import type { OportunidadeDto } from '@/model/oportunidade'
import { separarErros } from '@/lib/erros'
import { useGanharOportunidade, usePerderOportunidade } from '../use-oportunidades'

/** Confirmação em modal pequeno: ganhar avisa Contratos e Financeiro e não tem volta. */
export function ConfirmarGanho({ oportunidade, aoFechar }: { oportunidade: OportunidadeDto; aoFechar: () => void }) {
  const ganhar = useGanharOportunidade()
  return (
    <Modal
      open
      onClose={aoFechar}
      size="sm"
      title="Marcar como ganha?"
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button loading={ganhar.isPending} onClick={() => ganhar.mutate(oportunidade.id, { onSuccess: aoFechar })}>Marcar como ganha</Button>
        </>
      }
    >
      <p className="text-sm text-texto-2">
        <strong className="text-titulo">{oportunidade.titulo}</strong> será fechada como ganha. Contratos e Financeiro
        recebem o evento <code className="rounded bg-superficie-2 px-1 font-mono text-xs">crm.oportunidade.ganha</code> e a
        oportunidade não pode mais ser alterada.
      </p>
      {ganhar.error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{separarErros(ganhar.error, []).geral}</p>}
    </Modal>
  )
}

/** Perda exige motivo (PerderOportunidade) — é o que alimenta a análise de perdas. */
export function RegistrarPerda({ oportunidade, aoFechar }: { oportunidade: OportunidadeDto; aoFechar: () => void }) {
  const [motivo, setMotivo] = useState('')
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const perder = usePerderOportunidade()
  const doServidor = separarErros(perder.error, ['motivo'])
  const erro = erroLocal ?? doServidor.porCampo.motivo ?? doServidor.geral

  function confirmar() {
    if (!motivo.trim()) return setErroLocal('Informe o motivo da perda.')
    perder.mutate({ id: oportunidade.id, motivo }, { onSuccess: aoFechar })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="sm"
      title="Marcar como perdida"
      subtitle={oportunidade.titulo}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button variant="danger" loading={perder.isPending} onClick={confirmar}>Marcar como perdida</Button>
        </>
      }
    >
      <FormField label="Motivo da perda" required htmlFor="perda-motivo" error={erro}>
        <Textarea id="perda-motivo" data-autofocus value={motivo} maxLength={255} invalid={Boolean(erro)}
          placeholder="Ex.: Preço acima do orçamento"
          onChange={(e) => {
            setMotivo(e.target.value)
            setErroLocal(null)
          }} />
      </FormField>
      <p className="mt-3 text-xs text-texto-3">Depois de perdida, a oportunidade não pode mais ser alterada.</p>
    </Modal>
  )
}
