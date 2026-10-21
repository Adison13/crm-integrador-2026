import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, FormField, FormSection, Input, Modal, Select, Textarea } from '@/components/ui'
import type { TipoAtividade } from '@/model/atividade'
import { separarErros } from '@/lib/erros'
import { paraCampoDataHora } from '@/lib/formato'
import { TIPOS_DE_ATIVIDADE, type TFormAtividade } from '../oportunidades.types'
import { useRegistrarAtividade, validarAtividade } from '../use-atividades'

const TIPOS: TipoAtividade[] = ['ligacao', 'email', 'whatsapp', 'visita', 'outro']

/** Registra o que já foi feito com o cliente. O que ainda vai ser feito é tarefa. */
export function AtividadeModal({ oportunidadeId, aoFechar }: { oportunidadeId: string; aoFechar: () => void }) {
  const [form, setForm] = useState<TFormAtividade>(() => ({ tipo: 'ligacao', descricao: '', realizadaEm: paraCampoDataHora(new Date()) }))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const registrar = useRegistrarAtividade(oportunidadeId)
  const doServidor = separarErros(registrar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }

  function mudar<K extends keyof TFormAtividade>(campo: K, valor: TFormAtividade[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (registrar.error) registrar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarAtividade(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length === 0) registrar.mutate(form, { onSuccess: aoFechar })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title="Registrar atividade"
      subtitle="O que já foi feito com o cliente"
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-atividade" loading={registrar.isPending}>{!registrar.isPending && <Save aria-hidden className="size-4" />} Registrar</Button>
        </>
      }
    >
      <form id="form-atividade" onSubmit={enviar} noValidate>
        {doServidor.geral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{doServidor.geral}</p>}
        <FormSection title="Atividade">
          <FormField label="Tipo" required htmlFor="atividade-tipo" error={erros.tipo}>
            <Select id="atividade-tipo" value={form.tipo} onChange={(e) => mudar('tipo', e.target.value as TipoAtividade)}>
              {TIPOS.map((t) => <option key={t} value={t}>{TIPOS_DE_ATIVIDADE[t]}</option>)}
            </Select>
          </FormField>
          <FormField label="Quando" htmlFor="atividade-quando" error={erros.realizadaEm}>
            <Input id="atividade-quando" type="datetime-local" max={paraCampoDataHora(new Date())} value={form.realizadaEm}
              invalid={Boolean(erros.realizadaEm)} onChange={(e) => mudar('realizadaEm', e.target.value)} />
          </FormField>
          <FormField label="O que foi feito" required colSpan={2} htmlFor="atividade-descricao" error={erros.descricao}>
            <Textarea id="atividade-descricao" data-autofocus value={form.descricao} maxLength={2000} invalid={Boolean(erros.descricao)}
              placeholder="Ex.: Ligação com a CTO para apresentar a proposta" onChange={(e) => mudar('descricao', e.target.value)} />
          </FormField>
        </FormSection>
      </form>
    </Modal>
  )
}
