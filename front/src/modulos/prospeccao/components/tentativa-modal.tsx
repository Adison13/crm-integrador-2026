import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, FormField, FormSection, Input, Modal, Select, Textarea } from '@/components/ui'
import type { CanalTentativa, ItemProspeccao, ResultadoTentativa } from '@/model/prospeccao'
import { separarErros } from '@/lib/erros'
import { paraCampoDataHora } from '@/lib/formato'
import { useContatosDaEmpresa } from '../../contatos/use-contatos'
import { CANAIS, RESULTADOS, type TFormTentativa } from '../prospeccao.types'
import { useRegistrarTentativa, validarTentativa } from '../use-prospeccao'

/** Registra um contato já feito. Para o futuro, o caminho é uma tarefa. */
export function TentativaModal({ empresa, aoFechar }: { empresa: Pick<ItemProspeccao, 'id' | 'razaoSocial'>; aoFechar: () => void }) {
  const [form, setForm] = useState<TFormTentativa>(() => ({ canal: '', resultado: '', contatoId: '', observacao: '', realizadaEm: paraCampoDataHora(new Date()) }))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const registrar = useRegistrarTentativa()
  const contatos = useContatosDaEmpresa(empresa.id)
  // Erros do servidor no campo certo; os que não são de campo da tela vão para o aviso geral
  const doServidor = separarErros(registrar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }
  const erroGeral = doServidor.geral

  function mudar<K extends keyof TFormTentativa>(campo: K, valor: TFormTentativa[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (registrar.error) registrar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarTentativa(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length === 0) registrar.mutate({ empresaId: empresa.id, form }, { onSuccess: aoFechar })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title="Registrar tentativa de contato"
      subtitle={empresa.razaoSocial}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-tentativa" loading={registrar.isPending}>{!registrar.isPending && <Save aria-hidden className="size-4" />} Registrar</Button>
        </>
      }
    >
      <form id="form-tentativa" onSubmit={enviar} noValidate>
        {erroGeral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{erroGeral}</p>}
        <FormSection title="Contato realizado">
          <FormField label="Canal" required htmlFor="tentativa-canal" error={erros.canal}>
            <Select id="tentativa-canal" data-autofocus value={form.canal} invalid={Boolean(erros.canal)} onChange={(e) => mudar('canal', e.target.value as CanalTentativa | '')}>
              <option value="">Selecione...</option>
              {Object.entries(CANAIS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </Select>
          </FormField>
          <FormField label="Resultado" required htmlFor="tentativa-resultado" error={erros.resultado}>
            <Select id="tentativa-resultado" value={form.resultado} invalid={Boolean(erros.resultado)} onChange={(e) => mudar('resultado', e.target.value as ResultadoTentativa | '')}>
              <option value="">Selecione...</option>
              {Object.entries(RESULTADOS).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </Select>
          </FormField>
          <FormField label="Com quem" htmlFor="tentativa-contato" error={erros.contatoId}>
            <Select id="tentativa-contato" value={form.contatoId} onChange={(e) => mudar('contatoId', e.target.value)}>
              <option value="">Não identificado</option>
              {contatos.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormField>
          <FormField label="Quando" htmlFor="tentativa-quando" error={erros.realizadaEm}>
            <Input id="tentativa-quando" type="datetime-local" max={paraCampoDataHora(new Date())} value={form.realizadaEm} invalid={Boolean(erros.realizadaEm)}
              onChange={(e) => mudar('realizadaEm', e.target.value)} />
          </FormField>
          <FormField label="Observação" colSpan={2} htmlFor="tentativa-obs" error={erros.observacao}>
            <Textarea id="tentativa-obs" value={form.observacao} maxLength={1000} placeholder="O que foi dito, quando retornar..."
              onChange={(e) => mudar('observacao', e.target.value)} />
          </FormField>
        </FormSection>
      </form>
    </Modal>
  )
}
