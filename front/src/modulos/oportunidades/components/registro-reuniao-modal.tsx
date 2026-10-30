import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { Badge, Button, FormField, FormSection, Input, Modal, Textarea } from '@/components/ui'
import type { ReuniaoDto } from '@/model/atividade'
import { separarErros } from '@/lib/erros'
import { dataHora, hoje } from '@/lib/formato'
import type { TFormRegistroReuniao } from '../oportunidades.types'
import { useObjecoesFrequentes, useRegistrarReuniao, validarRegistro } from '../use-atividades'

/**
 * Registro pós-reunião (POST /reunioes/{id}/registro): resumo, o novo próximo passo da
 * oportunidade e as objeções levantadas. Depois de registrada, a reunião não muda mais.
 */
export function RegistroReuniaoModal({ reuniao, aoFechar }: { reuniao: ReuniaoDto; aoFechar: () => void }) {
  const [form, setForm] = useState<TFormRegistroReuniao>({ resumo: '', proximoPasso: '', dataProximoPasso: '', objecoes: [] })
  const [novaObjecao, setNovaObjecao] = useState('')
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const registrar = useRegistrarReuniao()
  const frequentes = useObjecoesFrequentes()
  const sugestoes = useId()
  const doServidor = separarErros(registrar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }

  function mudar<K extends keyof TFormRegistroReuniao>(campo: K, valor: TFormRegistroReuniao[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (registrar.error) registrar.reset()
  }

  function adicionarObjecao() {
    const motivo = novaObjecao.trim()
    if (!motivo || form.objecoes.includes(motivo)) return
    mudar('objecoes', [...form.objecoes, motivo.slice(0, 255)])
    setNovaObjecao('')
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    // Enter adiciona a objeção em vez de enviar o formulário
    if (evento.key === 'Enter') {
      evento.preventDefault()
      adicionarObjecao()
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarRegistro(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length === 0) registrar.mutate({ id: reuniao.id, form }, { onSuccess: aoFechar })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title="Registrar reunião"
      subtitle={[dataHora(reuniao.dataHora), reuniao.pauta].filter(Boolean).join(' · ')}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-registro" loading={registrar.isPending}>{!registrar.isPending && <Save aria-hidden className="size-4" />} Registrar</Button>
        </>
      }
    >
      <form id="form-registro" onSubmit={enviar} noValidate>
        {doServidor.geral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{doServidor.geral}</p>}

        <FormSection number={1} title="Como foi">
          <FormField label="Resumo" required colSpan={2} htmlFor="registro-resumo" error={erros.resumo}>
            <Textarea id="registro-resumo" data-autofocus value={form.resumo} maxLength={4000} invalid={Boolean(erros.resumo)}
              placeholder="O que foi apresentado, o que o cliente disse, o que ficou combinado" onChange={(e) => mudar('resumo', e.target.value)} />
          </FormField>
        </FormSection>

        <FormSection number={2} title="Próximo passo da oportunidade">
          <FormField label="Próximo passo" required htmlFor="registro-passo" error={erros.proximoPasso}>
            <Input id="registro-passo" value={form.proximoPasso} maxLength={255} invalid={Boolean(erros.proximoPasso)}
              placeholder="Ex.: Enviar proposta revisada" onChange={(e) => mudar('proximoPasso', e.target.value)} />
          </FormField>
          <FormField label="Data do próximo passo" required htmlFor="registro-data" error={erros.dataProximoPasso}>
            <Input id="registro-data" type="date" min={hoje()} value={form.dataProximoPasso} invalid={Boolean(erros.dataProximoPasso)}
              onChange={(e) => mudar('dataProximoPasso', e.target.value)} />
          </FormField>
        </FormSection>

        <FormSection number={3} title="Objeções levantadas">
          <FormField label="Objeção" colSpan={2} htmlFor="registro-objecao" error={erros.objecoes}
            hint="Enter adiciona. As mais registradas pela equipe aparecem como sugestão.">
            <div className="flex gap-2">
              <Input id="registro-objecao" list={sugestoes} value={novaObjecao} maxLength={255} placeholder="Ex.: Preço acima do orçamento"
                onChange={(e) => setNovaObjecao(e.target.value)} onKeyDown={aoTeclar} />
              <Button variant="secondary" onClick={adicionarObjecao} disabled={!novaObjecao.trim()}><Plus aria-hidden className="size-4" /> Adicionar</Button>
            </div>
            <datalist id={sugestoes}>{frequentes.map((m) => <option key={m} value={m} />)}</datalist>
          </FormField>
          {form.objecoes.length > 0 && (
            <ul aria-label="Objeções a registrar" className="flex flex-wrap gap-1.5 md:col-span-2">
              {form.objecoes.map((motivo) => (
                <li key={motivo}>
                  <Badge variant="orange">
                    {motivo}
                    <button type="button" aria-label={`Remover ${motivo}`} className="hover:text-red-600"
                      onClick={() => mudar('objecoes', form.objecoes.filter((o) => o !== motivo))}>
                      <X aria-hidden className="size-3" />
                    </button>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </FormSection>
      </form>
    </Modal>
  )
}
