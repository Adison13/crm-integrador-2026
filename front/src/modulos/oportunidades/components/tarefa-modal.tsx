import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, FormField, FormSection, Input, Modal, Select, Textarea } from '@/components/ui'
import type { TarefaDto, TipoTarefa } from '@/model/atividade'
import { useUsuarios } from '@/hooks/use-usuarios'
import { separarErros } from '@/lib/erros'
import { TIPOS_DE_ATIVIDADE, type TFormTarefa } from '../oportunidades.types'
import { formularioDaTarefa, useSalvarTarefa, validarTarefa } from '../use-atividades'

interface Props {
  oportunidadeId: string
  /** Sem tarefa, cria; com tarefa, edita. */
  tarefa?: TarefaDto
  /** Sem crm.oportunidade.editar, a tarefa fica com o próprio responsável (o back-end recusa repassar). */
  podeRepassar: boolean
  aoFechar: () => void
}

export function TarefaModal({ oportunidadeId, tarefa, podeRepassar, aoFechar }: Props) {
  const [form, setForm] = useState<TFormTarefa>(() => formularioDaTarefa(tarefa))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const salvar = useSalvarTarefa(oportunidadeId)
  const { opcoes } = useUsuarios()
  const doServidor = separarErros(salvar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }

  function mudar<K extends keyof TFormTarefa>(campo: K, valor: TFormTarefa[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (salvar.error) salvar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarTarefa(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length === 0) salvar.mutate({ id: tarefa?.id, form }, { onSuccess: aoFechar })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title={tarefa ? 'Editar tarefa' : 'Nova tarefa'}
      subtitle="O que ainda precisa ser feito nesta oportunidade"
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-tarefa" loading={salvar.isPending}>{!salvar.isPending && <Save aria-hidden className="size-4" />} Salvar</Button>
        </>
      }
    >
      <form id="form-tarefa" onSubmit={enviar} noValidate>
        {doServidor.geral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{doServidor.geral}</p>}
        <FormSection title="Tarefa">
          <FormField label="O que fazer" required colSpan={2} htmlFor="tarefa-descricao" error={erros.descricao}>
            <Textarea id="tarefa-descricao" data-autofocus value={form.descricao} maxLength={500} invalid={Boolean(erros.descricao)}
              placeholder="Ex.: Enviar a proposta revisada" onChange={(e) => mudar('descricao', e.target.value)} />
          </FormField>
          <FormField label="Tipo" htmlFor="tarefa-tipo" error={erros.tipo}>
            <Select id="tarefa-tipo" value={form.tipo} onChange={(e) => mudar('tipo', e.target.value as TipoTarefa | '')}>
              <option value="">Sem tipo</option>
              {Object.entries(TIPOS_DE_ATIVIDADE).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </Select>
          </FormField>
          <FormField label="Vencimento" htmlFor="tarefa-vencimento" error={erros.dataVencimento}>
            <Input id="tarefa-vencimento" type="datetime-local" value={form.dataVencimento} onChange={(e) => mudar('dataVencimento', e.target.value)} />
          </FormField>
          <FormField label="Responsável" htmlFor="tarefa-responsavel" error={erros.responsavelId}
            hint={podeRepassar ? 'Sem responsável, a tarefa fica com você.' : 'Só quem pode editar oportunidades repassa a tarefa.'}>
            <Select id="tarefa-responsavel" value={form.responsavelId} disabled={!podeRepassar} onChange={(e) => mudar('responsavelId', e.target.value)}>
              <option value="">Eu mesmo</option>
              {opcoes(form.responsavelId).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </Select>
          </FormField>
        </FormSection>
      </form>
    </Modal>
  )
}
