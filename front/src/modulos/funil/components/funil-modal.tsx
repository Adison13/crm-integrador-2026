import { useState, type FormEvent } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { Button, Checkbox, FormField, FormSection, Input, Modal } from '@/components/ui'
import { ConfirmarExclusao } from '@/components/confirmar-exclusao'
import type { FunilDto } from '@/model/funil'
import { separarErros } from '@/lib/erros'
import type { TEtapaEditavel } from '../funil.types'
import { useCriarFunil, useEditarFunil, useExcluirFunil } from '../use-funil'
import { EditorDeEtapas, etapasIniciais } from './editor-de-etapas'

interface Props {
  /** Sem funil, cria; com funil, edita nome e padrão (as etapas ficam em Gerenciar Etapas). */
  funil?: FunilDto
  aoFechar: () => void
  aoCriar?: (funil: FunilDto) => void
  aoExcluir?: () => void
}

/** Criar, renomear, definir como padrão e excluir funil. Exige crm.funil.administrar. */
export function FunilModal({ funil, aoFechar, aoCriar, aoExcluir }: Props) {
  const [nome, setNome] = useState(funil?.nome ?? '')
  const [padrao, setPadrao] = useState(funil?.padrao ?? false)
  const [etapas, setEtapas] = useState<TEtapaEditavel[]>(etapasIniciais)
  const [tentou, setTentou] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const criar = useCriarFunil()
  const editar = useEditarFunil()
  const excluir = useExcluirFunil()
  const gravacao = funil ? editar : criar
  const doServidor = separarErros(gravacao.error, ['nome'])

  const erroNome = tentou && !nome.trim() ? 'Informe o nome do funil.' : doServidor.porCampo.nome
  const etapaSemNome = tentou && etapas.some((e) => !e.nome.trim())

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (!nome.trim() || (!funil && etapas.some((e) => !e.nome.trim()))) return
    if (funil) editar.mutate({ id: funil.id, nome, padrao }, { onSuccess: aoFechar })
    else criar.mutate({ nome, etapas }, { onSuccess: (criado) => { aoCriar?.(criado); aoFechar() } })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title={funil ? 'Editar funil' : 'Novo funil'}
      subtitle={funil ? funil.nome : 'Um funil para outro tipo de venda, com etapas próprias'}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {/* O padrão não é excluído (409 FUNIL_PADRAO): primeiro outro vira padrão */}
          {funil && !funil.padrao
            ? <Button variant="danger" onClick={() => setExcluindo(true)}>
                <Trash2 aria-hidden className="size-4" /> Excluir funil
              </Button>
            : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
            <Button type="submit" form="form-funil" loading={gravacao.isPending}>{!gravacao.isPending && <Save aria-hidden className="size-4" />} {funil ? 'Salvar' : 'Criar funil'}</Button>
          </div>
        </div>
      }
    >
      <form id="form-funil" onSubmit={enviar} noValidate>
        {doServidor.geral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{doServidor.geral}</p>}
        <FormSection number={1} title="Funil">
          <FormField label="Nome" required colSpan={2} htmlFor="funil-nome" error={erroNome}>
            <Input id="funil-nome" data-autofocus value={nome} maxLength={100} invalid={Boolean(erroNome)} placeholder="Ex.: Funil Renovação"
              onChange={(e) => { setNome(e.target.value); if (gravacao.error) gravacao.reset() }} />
          </FormField>
          {funil && (
            <label className="flex items-start gap-2 text-sm text-texto md:col-span-2">
              <Checkbox checked={padrao} disabled={funil.padrao} onChange={(e) => setPadrao(e.target.checked)} className="mt-0.5" />
              <span>
                Funil padrão
                <span className="block text-xs text-texto-3">
                  {funil.padrao
                    ? 'Este já é o padrão. Para trocar, marque outro funil como padrão.'
                    : 'Oportunidade criada sem etapa — inclusive a convertida na prospecção — entra no padrão.'}
                </span>
              </span>
            </label>
          )}
        </FormSection>
        {!funil && (
          <FormSection number={2} title="Etapas">
            <div className="md:col-span-2">
              {etapaSemNome && <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">Toda etapa precisa de um nome.</p>}
              <EditorDeEtapas etapas={etapas} aoMudar={setEtapas} destacarSemNome={tentou} />
            </div>
          </FormSection>
        )}
      </form>

      {excluindo && funil && (
        <ConfirmarExclusao titulo="Excluir funil?" enviando={excluir.isPending} erro={excluir.error}
          aoConfirmar={() => excluir.mutate(funil.id, { onSuccess: () => { setExcluindo(false); aoExcluir?.(); aoFechar() } })}
          aoFechar={() => { excluir.reset(); setExcluindo(false) }}>
          {funil.nome} e as suas etapas deixam de existir. Funil com oportunidades não é excluído: mova-as antes.
        </ConfirmarExclusao>
      )}
    </Modal>
  )
}
