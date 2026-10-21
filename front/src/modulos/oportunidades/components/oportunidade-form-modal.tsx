import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, FormField, FormSection, Input, Modal, Select } from '@/components/ui'
import type { OportunidadeDto, TipoOportunidade } from '@/model/oportunidade'
import { useUsuarios } from '@/hooks/use-usuarios'
import { separarErros } from '@/lib/erros'
import { hoje } from '@/lib/formato'
import { useContatosDaEmpresa } from '../../contatos/use-contatos'
import { SeletorDeEmpresa } from '../../empresas/components/seletor-de-empresa'
import { useFunis } from '../../funil/use-funil'
import { TIPOS_DE_OPORTUNIDADE, type TFormOportunidade } from '../oportunidades.types'
import { formularioDe, useSalvarOportunidade, validarOportunidade } from '../use-oportunidades'

interface Props {
  oportunidade?: OportunidadeDto
  /** Valores já conhecidos ao criar: a empresa do detalhe, a etapa da coluna do funil. */
  inicial?: Partial<TFormOportunidade>
  aoFechar: () => void
  aoSalvar?: (oportunidade: OportunidadeDto) => void
}

export function OportunidadeFormModal({ oportunidade, inicial, aoFechar, aoSalvar }: Props) {
  const [form, setForm] = useState<TFormOportunidade>(() => formularioDe(oportunidade, inicial))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const salvar = useSalvarOportunidade()
  const contatos = useContatosDaEmpresa(form.empresaId)
  const funis = useFunis()
  const { opcoes } = useUsuarios()
  const editando = Boolean(oportunidade)
  const empresaFixa = Boolean(inicial?.empresaId)

  // Erros do servidor no campo certo; os que não são de campo da tela vão para o aviso geral
  const doServidor = separarErros(salvar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }
  const erroGeral = doServidor.geral

  function mudar<K extends keyof TFormOportunidade>(campo: K, valor: TFormOportunidade[K]) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
      // O contato precisa ser da empresa escolhida
      ...(campo === 'empresaId' ? { contatoId: '' } : {}),
    }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (salvar.error) salvar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarOportunidade(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length > 0) return
    salvar.mutate({ id: oportunidade?.id, form }, {
      onSuccess: (salva) => {
        aoSalvar?.(salva)
        aoFechar()
      },
    })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      title={editando ? 'Editar Oportunidade' : 'Nova Oportunidade'}
      subtitle={editando ? oportunidade?.titulo : 'Uma negociação com uma empresa, do primeiro contato ao fechamento'}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-oportunidade" loading={salvar.isPending}>
            {!salvar.isPending && <Save aria-hidden className="size-4" />}
            {editando ? 'Salvar alterações' : 'Criar Oportunidade'}
          </Button>
        </>
      }
    >
      <form id="form-oportunidade" onSubmit={enviar} noValidate>
        {erroGeral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{erroGeral}</p>}

        <FormSection number={1} title="Oportunidade">
          <FormField label="Título" required colSpan={2} htmlFor="op-titulo" error={erros.titulo}>
            <Input id="op-titulo" data-autofocus value={form.titulo} maxLength={255} invalid={Boolean(erros.titulo)}
              placeholder="Ex.: ERP Financeiro" onChange={(e) => mudar('titulo', e.target.value)} />
          </FormField>
          <FormField label="Empresa" required htmlFor="op-empresa" error={erros.empresaId}>
            <SeletorDeEmpresa id="op-empresa" valor={form.empresaId} invalid={Boolean(erros.empresaId)} disabled={empresaFixa}
              aoMudar={(empresaId) => mudar('empresaId', empresaId)} />
          </FormField>
          <FormField label="Contato" htmlFor="op-contato" error={erros.contatoId}
            hint={form.empresaId && contatos.data?.length === 0 ? 'Esta empresa ainda não tem contatos.' : undefined}>
            <Select id="op-contato" value={form.contatoId} disabled={!form.empresaId} onChange={(e) => mudar('contatoId', e.target.value)}>
              <option value="">{form.empresaId ? 'Sem contato' : 'Escolha a empresa primeiro'}</option>
              {contatos.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.cargo ? ` — ${c.cargo}` : ''}</option>)}
            </Select>
          </FormField>
          <FormField label="Tipo" htmlFor="op-tipo">
            <Select id="op-tipo" value={form.tipo} onChange={(e) => mudar('tipo', e.target.value as TipoOportunidade)}>
              {Object.entries(TIPOS_DE_OPORTUNIDADE).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </Select>
          </FormField>
          {/* A etapa só se escolhe na criação; depois ela muda pelo funil (POST /mover) */}
          {!editando && (
            <FormField label="Etapa" htmlFor="op-etapa" error={erros.etapaId}>
              <Select id="op-etapa" value={form.etapaId} onChange={(e) => mudar('etapaId', e.target.value)}>
                <option value="">Primeira etapa do funil padrão</option>
                {funis.data?.map((f) => (
                  <optgroup key={f.id} label={f.nome}>
                    {f.etapas.map((etapa) => <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>)}
                  </optgroup>
                ))}
              </Select>
            </FormField>
          )}
        </FormSection>

        <FormSection number={2} title="Valores e previsão">
          <FormField label="Valor de implantação (R$)" htmlFor="op-implantacao" error={erros.valorImplantacao}>
            <Input id="op-implantacao" inputMode="decimal" value={form.valorImplantacao} invalid={Boolean(erros.valorImplantacao)}
              placeholder="0,00" onChange={(e) => mudar('valorImplantacao', e.target.value)} />
          </FormField>
          <FormField label="MRR — receita mensal (R$)" htmlFor="op-mrr" error={erros.valorMrr}>
            <Input id="op-mrr" inputMode="decimal" value={form.valorMrr} invalid={Boolean(erros.valorMrr)}
              placeholder="0,00" onChange={(e) => mudar('valorMrr', e.target.value)} />
          </FormField>
          <FormField label="Probabilidade (%)" htmlFor="op-probabilidade" error={erros.probabilidade}>
            <Input id="op-probabilidade" type="number" min={0} max={100} step={1} value={form.probabilidade} invalid={Boolean(erros.probabilidade)}
              placeholder="0 a 100" onChange={(e) => mudar('probabilidade', e.target.value)} />
          </FormField>
          <FormField label="Fechamento previsto" htmlFor="op-fechamento">
            <Input id="op-fechamento" type="date" value={form.dataPrevistaFechamento} onChange={(e) => mudar('dataPrevistaFechamento', e.target.value)} />
          </FormField>
        </FormSection>

        <FormSection number={3} title="Próximo passo">
          <FormField label="Próximo passo" required colSpan={2} htmlFor="op-passo" error={erros.proximoPasso}
            hint="Toda oportunidade aberta tem um próximo passo com data (RF-CRM-03).">
            <Input id="op-passo" value={form.proximoPasso} maxLength={255} invalid={Boolean(erros.proximoPasso)}
              placeholder="Ex.: Agendar demo com a equipe técnica" onChange={(e) => mudar('proximoPasso', e.target.value)} />
          </FormField>
          <FormField label="Data do próximo passo" required htmlFor="op-data-passo" error={erros.dataProximoPasso}>
            <Input id="op-data-passo" type="date" min={editando ? undefined : hoje()} value={form.dataProximoPasso}
              invalid={Boolean(erros.dataProximoPasso)} onChange={(e) => mudar('dataProximoPasso', e.target.value)} />
          </FormField>
          <FormField label="Responsável" htmlFor="op-responsavel">
            <Select id="op-responsavel" value={form.responsavelId} onChange={(e) => mudar('responsavelId', e.target.value)}>
              <option value="">Sem responsável</option>
              {opcoes(form.responsavelId).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </Select>
          </FormField>
        </FormSection>
      </form>
    </Modal>
  )
}
