import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import type { FunilDto } from '@/model/funil'
import { separarErros } from '@/lib/erros'
import { COR_PADRAO, type TEtapaEditavel } from '../funil.types'
import { useSalvarEtapas } from '../use-funil'
import { EditorDeEtapas } from './editor-de-etapas'

/**
 * Tela 7 (modal): nome, cor e ordem das etapas. Etapa com oportunidades não sai do funil e o
 * funil fica com ao menos uma etapa — o servidor recusa com 409, e a mensagem aparece aqui.
 * Exige crm.funil.administrar.
 */
export function GerenciarEtapasModal({ funil, aoFechar }: { funil: FunilDto; aoFechar: () => void }) {
  const [etapas, setEtapas] = useState<TEtapaEditavel[]>(() =>
    funil.etapas.map((e) => ({ chave: e.id, id: e.id, nome: e.nome, cor: e.cor ?? COR_PADRAO })))
  const [semNome, setSemNome] = useState(false)
  const salvar = useSalvarEtapas()

  function mudar(novas: TEtapaEditavel[]) {
    setEtapas(novas)
    setSemNome(false)
    if (salvar.error) salvar.reset()
  }

  function confirmar() {
    if (etapas.some((e) => !e.nome.trim())) return setSemNome(true)
    salvar.mutate({ funil, etapas }, { onSuccess: aoFechar })
  }

  return (
    <Modal
      open
      onClose={aoFechar}
      size="lg"
      title="Gerenciar Etapas"
      subtitle={`Nome, cor e ordem das etapas de ${funil.nome}`}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button loading={salvar.isPending} onClick={confirmar}>{!salvar.isPending && <Save aria-hidden className="size-4" />} Salvar</Button>
        </>
      }
    >
      {salvar.error && <p role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{separarErros(salvar.error, []).geral} O que veio antes do erro já foi salvo — feche e abra de novo para conferir.</p>}
      {semNome && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">Toda etapa precisa de um nome.</p>}
      <EditorDeEtapas etapas={etapas} aoMudar={mudar} destacarSemNome={semNome} />
    </Modal>
  )
}
