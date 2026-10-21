import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, FormField, FormSection, Input, Modal, Select } from '@/components/ui'
import type { EmpresaDto, StatusComercial } from '@/model/empresa'
import { useUsuarios } from '@/hooks/use-usuarios'
import { idDoDuplicado, separarErros } from '@/lib/erros'
import { cnpj } from '@/lib/formato'
import { PORTES, SEGMENTOS, STATUS_COMERCIAL, UFS, type TFormEmpresa } from '../empresas.types'
import { formularioDe, useSalvarEmpresa, validarEmpresa } from '../use-empresas'

interface Props {
  /** Sem empresa, cria; com empresa, edita. */
  empresa?: EmpresaDto
  aoFechar: () => void
  aoSalvar?: (empresa: EmpresaDto) => void
  /** CNPJ já cadastrado: abre a empresa que existe em vez de criar outra (§10.3). */
  aoAbrirExistente: (id: string) => void
}

/** Tela 8: cadastro em modal com seções numeradas. Clicar fora não fecha, para não perder o que foi digitado. */
export function EmpresaFormModal({ empresa, aoFechar, aoSalvar, aoAbrirExistente }: Props) {
  const [form, setForm] = useState<TFormEmpresa>(() => formularioDe(empresa))
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const salvar = useSalvarEmpresa()
  const { opcoes } = useUsuarios()
  const editando = Boolean(empresa)

  // Erros do servidor no campo certo; os que não são de campo da tela vão para o aviso geral
  const doServidor = separarErros(salvar.error, Object.keys(form))
  const erros = { ...doServidor.porCampo, ...errosLocais }
  const erroGeral = doServidor.geral
  const duplicada = idDoDuplicado(salvar.error, 'empresaId')

  function mudar<K extends keyof TFormEmpresa>(campo: K, valor: TFormEmpresa[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErrosLocais(({ [campo]: _removido, ...resto }) => resto)
    if (salvar.error) salvar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarEmpresa(form)
    setErrosLocais(encontrados)
    if (Object.keys(encontrados).length > 0) return
    salvar.mutate({ id: empresa?.id, form }, {
      onSuccess: (salva) => {
        aoSalvar?.(salva)
        aoFechar()
      },
    })
  }

  // Segmento gravado fora da lista padrão (texto livre no back-end) continua aparecendo na edição
  const segmentos = form.segmento && !SEGMENTOS.includes(form.segmento) ? [form.segmento, ...SEGMENTOS] : SEGMENTOS

  return (
    <Modal
      open
      onClose={aoFechar}
      title={editando ? 'Editar Empresa' : 'Nova Empresa'}
      subtitle={editando ? empresa?.razaoSocial : 'Preencha os dados cadastrais da empresa'}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-empresa" loading={salvar.isPending}>
            {!salvar.isPending && <Save aria-hidden className="size-4" />}
            {editando ? 'Salvar alterações' : 'Criar Empresa'}
          </Button>
        </>
      }
    >
      <form id="form-empresa" onSubmit={enviar} noValidate>
        {erroGeral && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{erroGeral}</p>}

        <FormSection number={1} title="Identificação">
          <FormField label="Razão Social" required colSpan={2} htmlFor="empresa-razao" error={erros.razaoSocial}>
            <Input id="empresa-razao" data-autofocus value={form.razaoSocial} maxLength={255} invalid={Boolean(erros.razaoSocial)}
              placeholder="Ex.: Construtora Horizonte Ltda" onChange={(e) => mudar('razaoSocial', e.target.value)} />
          </FormField>
          <FormField label="Nome Fantasia" htmlFor="empresa-fantasia" error={erros.nomeFantasia}>
            <Input id="empresa-fantasia" value={form.nomeFantasia} maxLength={255} placeholder="Ex.: Horizonte"
              onChange={(e) => mudar('nomeFantasia', e.target.value)} />
          </FormField>
          <FormField label="CNPJ" htmlFor="empresa-cnpj" error={erros.cnpj}>
            <Input id="empresa-cnpj" value={cnpj(form.cnpj) ?? ''} inputMode="numeric" placeholder="00.000.000/0000-00" invalid={Boolean(erros.cnpj)}
              onChange={(e) => mudar('cnpj', e.target.value)} />
          </FormField>
          {duplicada && (
            <div className="md:col-span-2">
              <button type="button" onClick={() => aoAbrirExistente(duplicada)} className="text-xs font-medium text-brand-700 underline dark:text-brand-400">
                Abrir a empresa já cadastrada com este CNPJ
              </button>
            </div>
          )}
        </FormSection>

        <FormSection number={2} title="Porte e Segmento">
          <FormField label="Segmento" htmlFor="empresa-segmento">
            <Select id="empresa-segmento" value={form.segmento} onChange={(e) => mudar('segmento', e.target.value)}>
              <option value="">Selecione...</option>
              {segmentos.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Porte" htmlFor="empresa-porte">
            <Select id="empresa-porte" value={form.porte} onChange={(e) => mudar('porte', e.target.value)}>
              <option value="">Selecione...</option>
              {PORTES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </FormField>
        </FormSection>

        <FormSection number={3} title="Localização">
          <FormField label="Cidade" htmlFor="empresa-cidade">
            <Input id="empresa-cidade" value={form.cidade} maxLength={100} placeholder="Ex.: Goiânia" onChange={(e) => mudar('cidade', e.target.value)} />
          </FormField>
          <FormField label="UF" htmlFor="empresa-uf" error={erros.estado}>
            <Select id="empresa-uf" value={form.estado} onChange={(e) => mudar('estado', e.target.value)}>
              <option value="">Selecione...</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </Select>
          </FormField>
        </FormSection>

        {/* Vendedor e status só entram na edição: NovaEmpresa não os recebe (a empresa nasce lead) */}
        {editando && (
          <FormSection number={4} title="Comercial">
            <FormField label="Status comercial" htmlFor="empresa-status">
              <Select id="empresa-status" value={form.statusComercial} onChange={(e) => mudar('statusComercial', e.target.value as StatusComercial)}>
                {Object.entries(STATUS_COMERCIAL).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
              </Select>
            </FormField>
            <FormField label="Vendedor responsável" htmlFor="empresa-vendedor">
              <Select id="empresa-vendedor" value={form.vendedorResponsavel} onChange={(e) => mudar('vendedorResponsavel', e.target.value)}>
                <option value="">Sem vendedor</option>
                {opcoes(form.vendedorResponsavel).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </Select>
            </FormField>
          </FormSection>
        )}
      </form>
    </Modal>
  )
}
