import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, FormField, FormSection, Input, Modal, Select } from '@/components/ui'
import type { ConsentimentoLgpd, ContatoDto, PapelContato, PreferenciaComunicacao } from '@/model/contato'
import { idDoDuplicado, separarErros } from '@/lib/erros'
import { telefone } from '@/lib/formato'
import { SeletorDeEmpresa } from '../../empresas/components/seletor-de-empresa'
import { CONSENTIMENTOS, PAPEIS, PREFERENCIAS, type TFormContato } from '../contatos.types'
import { formularioDe, useSalvarContato, validarContato } from '../use-contatos'

interface Props {
  contato?: ContatoDto
  /** Empresa já escolhida ao criar. */
  empresaId?: string
  /** O contato nasce dentro do detalhe da empresa: a empresa não muda. */
  empresaFixa?: boolean
  aoFechar: () => void
  aoSalvar?: (contato: ContatoDto) => void
  /** E-mail já cadastrado na empresa: abre o contato existente (§10.3). */
  aoAbrirExistente?: (id: string) => void
}

export function ContatoFormModal({ contato, empresaId, empresaFixa = false, aoFechar, aoSalvar, aoAbrirExistente }: Props) {
  const [form, setForm] = useState<TFormContato>(() => formularioDe(contato, empresaId))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const salvar = useSalvarContato()
  const editando = Boolean(contato)

  // Erros do servidor no campo certo; os que não são de campo da tela vão para o aviso geral
  const doServidor = separarErros(salvar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }
  const erroGeral = doServidor.geral
  const duplicado = idDoDuplicado(salvar.error, 'contatoId')

  function mudar<K extends keyof TFormContato>(campo: K, valor: TFormContato[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (salvar.error) salvar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarContato(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length > 0) return
    salvar.mutate({ id: contato?.id, form }, {
      onSuccess: (salvo) => {
        aoSalvar?.(salvo)
        aoFechar()
      },
    })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      title={editando ? 'Editar Contato' : 'Novo Contato'}
      subtitle={editando ? contato?.nome : 'Pessoa de contato vinculada a uma empresa'}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-contato" loading={salvar.isPending}>
            {!salvar.isPending && <Save aria-hidden className="size-4" />}
            {editando ? 'Salvar alterações' : 'Criar Contato'}
          </Button>
        </>
      }
    >
      <form id="form-contato" onSubmit={enviar} noValidate>
        {erroGeral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{erroGeral}</p>}

        <FormSection number={1} title="Identificação">
          <FormField label="Nome" required colSpan={2} htmlFor="contato-nome" error={erros.nome}>
            <Input id="contato-nome" data-autofocus value={form.nome} maxLength={255} invalid={Boolean(erros.nome)}
              placeholder="Ex.: Ricardo Andrade" onChange={(e) => mudar('nome', e.target.value)} />
          </FormField>
          <FormField label="Empresa" required htmlFor="contato-empresa" error={erros.empresaId}>
            <SeletorDeEmpresa id="contato-empresa" valor={form.empresaId} invalid={Boolean(erros.empresaId)} disabled={empresaFixa && !editando}
              aoMudar={(empresaId) => mudar('empresaId', empresaId)} />
          </FormField>
          <FormField label="Cargo" htmlFor="contato-cargo" error={erros.cargo}>
            <Input id="contato-cargo" value={form.cargo} maxLength={100} placeholder="Ex.: Diretor de Operações" onChange={(e) => mudar('cargo', e.target.value)} />
          </FormField>
          <FormField label="Papel na conta" htmlFor="contato-papel" hint="Quem decide, influencia, avalia ou paga.">
            <Select id="contato-papel" value={form.papel} onChange={(e) => mudar('papel', e.target.value as PapelContato | '')}>
              <option value="">Selecione...</option>
              {Object.entries(PAPEIS).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </Select>
          </FormField>
        </FormSection>

        <FormSection number={2} title="Canais de comunicação">
          <FormField label="E-mail" htmlFor="contato-email" error={erros.email}>
            <Input id="contato-email" type="email" value={form.email} maxLength={255} invalid={Boolean(erros.email)}
              placeholder="nome@empresa.com.br" onChange={(e) => mudar('email', e.target.value)} />
          </FormField>
          <FormField label="Telefone / WhatsApp" htmlFor="contato-telefone" error={erros.telefone}>
            <Input id="contato-telefone" type="tel" value={telefone(form.telefone) ?? ''} inputMode="tel" placeholder="(62) 99999-0000"
              onChange={(e) => mudar('telefone', e.target.value)} />
          </FormField>
          <FormField label="Preferência de contato" htmlFor="contato-preferencia">
            <Select id="contato-preferencia" value={form.preferenciaComunicacao}
              onChange={(e) => mudar('preferenciaComunicacao', e.target.value as PreferenciaComunicacao | '')}>
              <option value="">Selecione...</option>
              {Object.entries(PREFERENCIAS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </Select>
          </FormField>
          {duplicado && aoAbrirExistente && (
            <div className="md:col-span-2">
              <button type="button" onClick={() => aoAbrirExistente(duplicado)} className="text-xs font-medium text-brand-700 underline dark:text-brand-400">
                Abrir o contato já cadastrado com este e-mail
              </button>
            </div>
          )}
        </FormSection>

        <FormSection number={3} title="LGPD">
          <FormField label="Consentimento" htmlFor="contato-lgpd" hint="Sem consentimento concedido, o contato não recebe comunicação de marketing.">
            <Select id="contato-lgpd" value={form.consentimentoLgpd}
              onChange={(e) => mudar('consentimentoLgpd', e.target.value as ConsentimentoLgpd | '')}>
              <option value="">Não informado</option>
              {Object.entries(CONSENTIMENTOS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </Select>
          </FormField>
        </FormSection>
      </form>
    </Modal>
  )
}
