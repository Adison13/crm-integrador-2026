import { useState, type FormEvent } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button, FormField, FormSection, Input, Modal, Select } from '@/components/ui'
import type { ItemProspeccao } from '@/model/prospeccao'
import { useUsuarios } from '@/hooks/use-usuarios'
import { separarErros } from '@/lib/erros'
import { hoje } from '@/lib/formato'
import { useContatosDaEmpresa } from '../../contatos/use-contatos'
import type { TFormOportunidade } from '../../oportunidades/oportunidades.types'
import { dadosComerciais, formularioDe, validarOportunidade } from '../../oportunidades/use-oportunidades'
import { useConverterEmpresa } from '../use-prospeccao'

/**
 * Converte a empresa em oportunidade (POST /empresas/{id}/converter): nasce na primeira etapa do
 * funil padrão, com origem "prospeccao", e a empresa em lead passa a prospect.
 */
export function ConverterModal({ empresa, aoFechar }: { empresa: ItemProspeccao; aoFechar: () => void }) {
  const [form, setForm] = useState<TFormOportunidade>(() =>
    formularioDe(undefined, { empresaId: empresa.id, responsavelId: empresa.vendedorResponsavel ?? '' }))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const converter = useConverterEmpresa()
  const contatos = useContatosDaEmpresa(empresa.id)
  const { opcoes } = useUsuarios()
  const navegar = useNavigate()
  // Erros do servidor no campo certo; os que não são de campo da tela vão para o aviso geral
  const doServidor = separarErros(converter.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }
  const erroGeral = doServidor.geral

  function mudar<K extends keyof TFormOportunidade>(campo: K, valor: TFormOportunidade[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (converter.error) converter.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarOportunidade(form, { exigeEmpresa: false })
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length > 0) return
    converter.mutate({ empresaId: empresa.id, dados: dadosComerciais(form) }, {
      onSuccess: (criada) => navegar(`/oportunidades/${criada.id}`),
    })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      title="Converter em oportunidade"
      subtitle={`${empresa.razaoSocial} · entra na primeira etapa do funil padrão`}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-converter" loading={converter.isPending}>
            {!converter.isPending && <ArrowRightLeft aria-hidden className="size-4" />} Converter
          </Button>
        </>
      }
    >
      <form id="form-converter" onSubmit={enviar} noValidate>
        {erroGeral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{erroGeral}</p>}
        {empresa.statusComercial === 'lead' && (
          <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800 dark:bg-brand-800/20 dark:text-brand-300">
            A empresa passa de <strong>lead</strong> a <strong>prospect</strong> ao converter.
          </p>
        )}

        <FormSection number={1} title="Oportunidade">
          <FormField label="Título" required colSpan={2} htmlFor="conv-titulo" error={erros.titulo}>
            <Input id="conv-titulo" data-autofocus value={form.titulo} maxLength={255} invalid={Boolean(erros.titulo)}
              placeholder="Ex.: CRM + Comercial" onChange={(e) => mudar('titulo', e.target.value)} />
          </FormField>
          <FormField label="Contato" htmlFor="conv-contato" error={erros.contatoId}>
            <Select id="conv-contato" value={form.contatoId} onChange={(e) => mudar('contatoId', e.target.value)}>
              <option value="">Sem contato</option>
              {contatos.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.cargo ? ` — ${c.cargo}` : ''}</option>)}
            </Select>
          </FormField>
          <FormField label="Responsável" htmlFor="conv-responsavel">
            <Select id="conv-responsavel" value={form.responsavelId} onChange={(e) => mudar('responsavelId', e.target.value)}>
              <option value="">Sem responsável</option>
              {opcoes(form.responsavelId).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </Select>
          </FormField>
        </FormSection>

        <FormSection number={2} title="Valores e previsão">
          <FormField label="Valor de implantação (R$)" htmlFor="conv-implantacao" error={erros.valorImplantacao}>
            <Input id="conv-implantacao" inputMode="decimal" value={form.valorImplantacao} invalid={Boolean(erros.valorImplantacao)} placeholder="0,00"
              onChange={(e) => mudar('valorImplantacao', e.target.value)} />
          </FormField>
          <FormField label="MRR — receita mensal (R$)" htmlFor="conv-mrr" error={erros.valorMrr}>
            <Input id="conv-mrr" inputMode="decimal" value={form.valorMrr} invalid={Boolean(erros.valorMrr)} placeholder="0,00"
              onChange={(e) => mudar('valorMrr', e.target.value)} />
          </FormField>
          <FormField label="Probabilidade (%)" htmlFor="conv-probabilidade" error={erros.probabilidade}>
            <Input id="conv-probabilidade" type="number" min={0} max={100} value={form.probabilidade} invalid={Boolean(erros.probabilidade)}
              placeholder="0 a 100" onChange={(e) => mudar('probabilidade', e.target.value)} />
          </FormField>
          <FormField label="Fechamento previsto" htmlFor="conv-fechamento">
            <Input id="conv-fechamento" type="date" value={form.dataPrevistaFechamento} onChange={(e) => mudar('dataPrevistaFechamento', e.target.value)} />
          </FormField>
        </FormSection>

        <FormSection number={3} title="Próximo passo">
          <FormField label="Próximo passo" required htmlFor="conv-passo" error={erros.proximoPasso}>
            <Input id="conv-passo" value={form.proximoPasso} maxLength={255} invalid={Boolean(erros.proximoPasso)}
              placeholder="Ex.: Apresentar o diagnóstico gratuito" onChange={(e) => mudar('proximoPasso', e.target.value)} />
          </FormField>
          <FormField label="Data do próximo passo" required htmlFor="conv-data-passo" error={erros.dataProximoPasso}>
            <Input id="conv-data-passo" type="date" min={hoje()} value={form.dataProximoPasso} invalid={Boolean(erros.dataProximoPasso)}
              onChange={(e) => mudar('dataProximoPasso', e.target.value)} />
          </FormField>
        </FormSection>
      </form>
    </Modal>
  )
}
