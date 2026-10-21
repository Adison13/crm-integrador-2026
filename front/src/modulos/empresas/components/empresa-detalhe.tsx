import { useState, type ReactNode } from 'react'
import { BriefcaseBusiness, Building, MapPin, Pencil, Plus, SearchX, UsersRound, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  Avatar, Badge, Button, DetailField, DetailSection, EmptyState, Modal, Spinner, Tabs, statusBadge,
} from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import type { EmpresaDto } from '@/model/empresa'
import { useUsuarios } from '@/hooks/use-usuarios'
import { cnpj, dataHora, local, moedaCurta } from '@/lib/formato'
import { ErroDaApi } from '@/plataforma/api'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes } from '@/hooks/use-sessao'
import { ContatoFormModal } from '../../contatos/components/contato-form-modal'
import { PAPEIS } from '../../contatos/contatos.types'
import { useContatosDaEmpresa } from '../../contatos/use-contatos'
import { useFunis } from '../../funil/use-funil'
import { OportunidadeFormModal } from '../../oportunidades/components/oportunidade-form-modal'
import { STATUS_DA_OPORTUNIDADE } from '../../oportunidades/oportunidades.types'
import { useOportunidadesDaEmpresa } from '../../oportunidades/use-oportunidades'
import { STATUS_COMERCIAL, TIPOS_DE_UNIDADE } from '../empresas.types'
import { useEmpresa, useStatusExternos, useUnidades } from '../use-empresas'
import { StatusExterno } from './status-externo'

interface Props {
  id: string
  aoFechar: () => void
  /** Ausente quando o perfil não tem crm.empresa.editar. */
  aoEditar?: (empresa: EmpresaDto) => void
}

/** Detalhe da empresa: modal sem padding com cabeçalho brand-950 e abas (design system §5.2 e §12.4). */
export function EmpresaDetalhe({ id, aoFechar, aoEditar }: Props) {
  const consulta = useEmpresa(id)
  const empresa = consulta.data

  return (
    <Modal open onClose={aoFechar} noPad size="xl" title={empresa?.razaoSocial ?? 'Empresa'}>
      {consulta.isPending && <Spinner className="min-h-80" />}
      {consulta.isError && (
        consulta.error instanceof ErroDaApi && consulta.error.status === 404
          ? <EmptyState icon={<SearchX aria-hidden />} title="Empresa não encontrada" action={<Button variant="outline" onClick={aoFechar}>Fechar</Button>}>
              Ela pode ter sido excluída ou pertencer a outra empresa do sistema.
            </EmptyState>
          : <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
      )}
      {empresa && <Conteudo empresa={empresa} aoFechar={aoFechar} aoEditar={aoEditar} />}
    </Modal>
  )
}

function Conteudo({ empresa, aoFechar, aoEditar }: { empresa: EmpresaDto; aoFechar: () => void; aoEditar?: (empresa: EmpresaDto) => void }) {
  const [aba, setAba] = useState(0)
  const contatos = useContatosDaEmpresa(empresa.id)
  const unidades = useUnidades(empresa.id)
  const oportunidades = useOportunidadesDaEmpresa(empresa.id)
  const contagem = (n: number | undefined) => (n === undefined ? '' : ` (${n})`)

  return (
    <>
      <div className="shrink-0 bg-brand-950 px-6 py-5 text-white">
        <div className="flex items-start gap-4">
          <Avatar nome={empresa.razaoSocial} size="lg" tom="destaque" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight">{empresa.razaoSocial}</h2>
            <p className="mt-0.5 text-xs text-brand-300">
              {[empresa.nomeFantasia, cnpj(empresa.cnpj), local(empresa.cidade, empresa.estado)].filter(Boolean).join(' · ') || 'Sem dados complementares'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {statusBadge(STATUS_COMERCIAL[empresa.statusComercial])}
              {empresa.segmento && <Badge variant="indigo">{empresa.segmento}</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {aoEditar && (
              <Button variant="secondary" size="sm" onClick={() => aoEditar(empresa)}>
                <Pencil aria-hidden className="size-3.5" /> Editar
              </Button>
            )}
            <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-900 hover:text-white">
              <X aria-hidden className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <Tabs
        tabs={['Dados', `Contatos${contagem(contatos.data?.length)}`, `Unidades${contagem(unidades.data?.length)}`, `Oportunidades${contagem(oportunidades.data?.length)}`]}
        active={aba}
        onChange={setAba}
      />

      <div className="min-h-72 flex-1 overflow-y-auto px-6 py-5">
        {aba === 0 && <AbaDados empresa={empresa} />}
        {aba === 1 && <AbaContatos empresaId={empresa.id} />}
        {aba === 2 && (
          <Lista consulta={unidades} vazio={<EmptyState icon={<Building aria-hidden />} title="Nenhuma unidade cadastrada" />}>
            {(itens) => itens.map((u) => (
              <li key={u.id} className="flex items-start gap-3 px-4 py-3">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-texto-3" />
                <div className="min-w-0 flex-1 text-sm text-texto">{u.endereco ?? <span className="text-texto-3">Endereço não informado</span>}</div>
                <Badge variant={u.tipo === 'matriz' ? 'green' : 'gray'}>{TIPOS_DE_UNIDADE[u.tipo]}</Badge>
              </li>
            ))}
          </Lista>
        )}
        {aba === 3 && <AbaOportunidades empresaId={empresa.id} />}
      </div>
    </>
  )
}

function AbaDados({ empresa }: { empresa: EmpresaDto }) {
  const { nome } = useUsuarios()
  const externos = useStatusExternos([empresa.id])
  const status = externos.data?.[empresa.id]
  return (
    <>
      <DetailSection number={1} title="Identificação">
        <DetailField label="Razão social" colSpan={2}>{empresa.razaoSocial}</DetailField>
        <DetailField label="Nome fantasia">{empresa.nomeFantasia}</DetailField>
        <DetailField label="CNPJ">{empresa.cnpj && <span className="font-mono">{cnpj(empresa.cnpj)}</span>}</DetailField>
        <DetailField label="Segmento">{empresa.segmento}</DetailField>
        <DetailField label="Porte">{empresa.porte}</DetailField>
        <DetailField label="Cidade/UF">{local(empresa.cidade, empresa.estado)}</DetailField>
      </DetailSection>
      <DetailSection number={2} title="Comercial">
        <DetailField label="Status comercial">{statusBadge(STATUS_COMERCIAL[empresa.statusComercial])}</DetailField>
        <DetailField label="Vendedor responsável">{nome(empresa.vendedorResponsavel)}</DetailField>
        <DetailField label="Origem do cadastro">{`${empresa.origem} · ${empresa.origemModuloId}`}</DetailField>
        <DetailField label="Cadastrada em">{dataHora(empresa.criadoEm)}</DetailField>
      </DetailSection>
      <DetailSection number={3} title="Status nos outros módulos">
        <DetailField label="Financeiro"><StatusExterno dono="Financeiro" valor={status?.financeiro} carregando={externos.isPending} /></DetailField>
        <DetailField label="Contratual"><StatusExterno dono="Contratos" valor={status?.contratual} carregando={externos.isPending} /></DetailField>
        <DetailField label="Técnico"><StatusExterno dono="Chamados" valor={status?.tecnico} carregando={externos.isPending} /></DetailField>
      </DetailSection>
    </>
  )
}

function AbaContatos({ empresaId }: { empresaId: string }) {
  const contatos = useContatosDaEmpresa(empresaId)
  const [novo, setNovo] = useState(false)
  const navegar = useNavigate()
  const { tem } = usePermissoes()
  return (
    <>
      {tem(PERMISSOES.contatoCriar) && (
        <div className="mb-3 flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => setNovo(true)}><Plus aria-hidden className="size-3.5" /> Novo contato</Button>
        </div>
      )}
      <Lista consulta={contatos} vazio={<EmptyState icon={<UsersRound aria-hidden />} title="Nenhum contato nesta empresa" />}>
        {(itens) => itens.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => navegar(`/contatos/${c.id}?empresa=${empresaId}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-superficie-2">
              <Avatar nome={c.nome} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-titulo">{c.nome}</p>
                <p className="truncate text-xs text-texto-3">{[c.cargo, c.email].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              {c.papel && <Badge variant={PAPEIS[c.papel].cor}>{PAPEIS[c.papel].rotulo}</Badge>}
            </button>
          </li>
        ))}
      </Lista>
      {novo && <ContatoFormModal empresaId={empresaId} empresaFixa aoFechar={() => setNovo(false)} />}
    </>
  )
}

function AbaOportunidades({ empresaId }: { empresaId: string }) {
  const oportunidades = useOportunidadesDaEmpresa(empresaId)
  const funis = useFunis()
  const { nome } = useUsuarios()
  const [nova, setNova] = useState(false)
  const navegar = useNavigate()
  const { tem } = usePermissoes()
  const etapa = (etapaId: string) => funis.data?.flatMap((f) => f.etapas).find((e) => e.id === etapaId)?.nome

  return (
    <>
      {tem(PERMISSOES.oportunidadeCriar) && (
        <div className="mb-3 flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => setNova(true)}><Plus aria-hidden className="size-3.5" /> Nova oportunidade</Button>
        </div>
      )}
      <Lista consulta={oportunidades} vazio={<EmptyState icon={<BriefcaseBusiness aria-hidden />} title="Nenhuma oportunidade com esta empresa" />}>
        {(itens) => itens.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => navegar(`/oportunidades/${o.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-superficie-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-titulo">{o.titulo}</p>
                <p className="truncate text-xs text-texto-3">
                  {[o.status === 'aberta' ? etapa(o.etapaId) : null, nome(o.responsavelId)].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-titulo">{moedaCurta(o.valorImplantacao) ?? '—'}</p>
                <p className="text-xs text-texto-3">{o.valorMrr != null ? `MRR ${moedaCurta(o.valorMrr)}` : ''}</p>
              </div>
              <Badge variant={STATUS_DA_OPORTUNIDADE[o.status].cor}>{STATUS_DA_OPORTUNIDADE[o.status].rotulo}</Badge>
            </button>
          </li>
        ))}
      </Lista>
      {nova && <OportunidadeFormModal inicial={{ empresaId }} aoFechar={() => setNova(false)} />}
    </>
  )
}

/** Lista de uma aba: carregando, erro, vazia ou os itens dentro de um cartão. */
function Lista<T>({ consulta, vazio, children }: {
  consulta: { isPending: boolean; isError: boolean; error: unknown; data: T[] | undefined; refetch: () => unknown }
  vazio: ReactNode
  children: (itens: T[]) => ReactNode
}) {
  if (consulta.isPending) return <Spinner />
  if (consulta.isError) return <FalhaAoCarregar erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
  if (!consulta.data?.length) return <>{vazio}</>
  return <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">{children(consulta.data)}</ul>
}
