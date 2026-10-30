import type { ReactNode } from 'react'
import { Button, Modal } from '@/components/ui'
import { separarErros } from '@/lib/erros'

interface Props {
  titulo: string
  children: ReactNode
  /** Texto do botão vermelho, ex.: "Excluir", "Cancelar reunião". */
  confirmar?: string
  enviando: boolean
  erro: unknown
  aoConfirmar: () => void
  aoFechar: () => void
}

/** Confirmação de ação irreversível em modal pequeno (design system: vermelho só para isso). */
export function ConfirmarExclusao({ titulo, children, confirmar = 'Excluir', enviando, erro, aoConfirmar, aoFechar }: Props) {
  return (
    <Modal
      open
      onClose={aoFechar}
      size="sm"
      title={titulo}
      footer={
        <>
          <Button variant="outline" onClick={aoFechar}>Voltar</Button>
          <Button variant="danger" loading={enviando} onClick={aoConfirmar}>{confirmar}</Button>
        </>
      }
    >
      <div className="text-sm text-texto-2">{children}</div>
      {erro != null && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{separarErros(erro, []).geral}</p>}
    </Modal>
  )
}
