import { useState } from 'react'
import { PhoneCall, PhoneOff, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState, Modal, Spinner } from '@/components/ui'
import { FalhaAoCarregar } from '@/components/falha-ao-carregar'
import { ConfirmarExclusao } from '@/components/confirmar-exclusao'
import type { ItemProspeccao, TentativaDto } from '@/model/prospeccao'
import { PERMISSOES } from '@/plataforma/permissoes'
import { usePermissoes, useSessao } from '@/hooks/use-sessao'
import { useUsuarios } from '@/hooks/use-usuarios'
import { dataHora } from '@/lib/formato'
import { useContatosDaEmpresa } from '../../contatos/use-contatos'
import { RESULTADOS } from '../prospeccao.types'
import { useExcluirTentativa, useTentativas } from '../use-prospeccao'
import { IconeDoCanal } from './canal'

/** Todas as tentativas de contato com a empresa, da mais recente para a mais antiga. */
export function HistoricoModal({ empresa, aoFechar, aoRegistrar }: { empresa: ItemProspeccao; aoFechar: () => void; aoRegistrar?: () => void }) {
  const tentativas = useTentativas(empresa.id)
  const contatos = useContatosDaEmpresa(empresa.id)
  const { nome } = useUsuarios()
  const { tem } = usePermissoes()
  const meuId = useSessao()?.usuario.id
  const [excluindo, setExcluindo] = useState<TentativaDto | null>(null)
  const excluir = useExcluirTentativa()
  // Exclui quem registra tentativas: a própria, ou a de qualquer um com crm.oportunidade.editar
  const podeExcluir = (t: TentativaDto) => tem(PERMISSOES.prospeccaoRegistrar) && (tem(PERMISSOES.oportunidadeEditar) || t.responsavelId === meuId)
  const nomeDoContato = (id: string | null) => contatos.data?.find((c) => c.id === id)?.nome

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title="Tentativas de contato"
      subtitle={empresa.razaoSocial}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Fechar</Button>
          {aoRegistrar && <Button onClick={aoRegistrar}><PhoneCall aria-hidden className="size-4" /> Registrar tentativa</Button>}
        </>
      }
    >
      {tentativas.isPending && <Spinner />}
      {tentativas.isError && <FalhaAoCarregar erro={tentativas.error} aoTentarDeNovo={() => void tentativas.refetch()} />}
      {tentativas.data?.itens.length === 0 && <EmptyState icon={<PhoneOff aria-hidden />} title="Nenhuma tentativa registrada" />}
      {Boolean(tentativas.data?.itens.length) && (
        <ol className="space-y-3">
          {tentativas.data?.itens.map((t) => (
            <li key={t.id} className="flex items-start gap-3 rounded-xl border border-borda p-3">
              <span className="mt-0.5"><IconeDoCanal canal={t.canal} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={RESULTADOS[t.resultado].cor}>{RESULTADOS[t.resultado].rotulo}</Badge>
                  <span className="text-xs text-texto-3">{dataHora(t.realizadaEm)}</span>
                </div>
                {t.observacao && <p className="mt-1.5 text-sm text-texto">{t.observacao}</p>}
                <p className="mt-1 text-xs text-texto-3">
                  {[nomeDoContato(t.contatoId) && `com ${nomeDoContato(t.contatoId)}`, nome(t.responsavelId) && `por ${nome(t.responsavelId)}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              {podeExcluir(t) && (
                <button type="button" aria-label="Excluir tentativa" title="Excluir tentativa" onClick={() => setExcluindo(t)}
                  className="-m-1 rounded-lg p-1.5 text-texto-3 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {excluindo && (
        <ConfirmarExclusao titulo="Excluir tentativa?" enviando={excluir.isPending} erro={excluir.error}
          aoConfirmar={() => excluir.mutate(excluindo.id, { onSuccess: () => setExcluindo(null) })}
          aoFechar={() => { excluir.reset(); setExcluindo(null) }}>
          A tentativa de {dataHora(excluindo.realizadaEm)} sai do histórico da empresa.
        </ConfirmarExclusao>
      )}
    </Modal>
  )
}
