import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, FormField, FormSection, Input, Modal, Textarea } from '@/components/ui'
import type { ReuniaoDto } from '@/model/atividade'
import { separarErros } from '@/lib/erros'
import type { TFormReuniao } from '../oportunidades.types'
import { formularioDaReuniao, useSalvarReuniao, validarReuniao } from '../use-atividades'

/** Agenda (sem reunião) ou reagenda. Só em oportunidade aberta e reunião ainda não registrada. */
export function ReuniaoModal({ oportunidadeId, reuniao, aoFechar }: { oportunidadeId: string; reuniao?: ReuniaoDto; aoFechar: () => void }) {
  const [form, setForm] = useState<TFormReuniao>(() => formularioDaReuniao(reuniao))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const salvar = useSalvarReuniao(oportunidadeId)
  const doServidor = separarErros(salvar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }

  function mudar<K extends keyof TFormReuniao>(campo: K, valor: TFormReuniao[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (salvar.error) salvar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarReuniao(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length === 0) salvar.mutate({ id: reuniao?.id, form }, { onSuccess: aoFechar })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title={reuniao ? 'Reagendar reunião' : 'Agendar reunião'}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-reuniao" loading={salvar.isPending}>{!salvar.isPending && <Save aria-hidden className="size-4" />} Salvar</Button>
        </>
      }
    >
      <form id="form-reuniao" onSubmit={enviar} noValidate>
        {doServidor.geral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{doServidor.geral}</p>}
        <FormSection title="Reunião">
          <FormField label="Data e hora" required htmlFor="reuniao-data" error={erros.dataHora}>
            <Input id="reuniao-data" data-autofocus type="datetime-local" value={form.dataHora} invalid={Boolean(erros.dataHora)}
              onChange={(e) => mudar('dataHora', e.target.value)} />
          </FormField>
          <FormField label="Local ou link" htmlFor="reuniao-local" error={erros.localOuLink}>
            <Input id="reuniao-local" value={form.localOuLink} maxLength={255} placeholder="Ex.: https://meet.google.com/..."
              onChange={(e) => mudar('localOuLink', e.target.value)} />
          </FormField>
          <FormField label="Participantes" colSpan={2} htmlFor="reuniao-participantes" error={erros.participantes}>
            <Textarea id="reuniao-participantes" value={form.participantes} maxLength={2000} placeholder="Quem vai participar, do cliente e da equipe"
              onChange={(e) => mudar('participantes', e.target.value)} />
          </FormField>
          <FormField label="Pauta" colSpan={2} htmlFor="reuniao-pauta" error={erros.pauta}>
            <Textarea id="reuniao-pauta" value={form.pauta} maxLength={2000} placeholder="O que vai ser tratado"
              onChange={(e) => mudar('pauta', e.target.value)} />
          </FormField>
        </FormSection>
      </form>
    </Modal>
  )
}
