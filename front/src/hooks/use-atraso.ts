import { useEffect, useState } from 'react'

/** Valor que só muda depois de o usuário parar de digitar — evita uma consulta por tecla. */
export function useAtraso<T>(valor: T, espera = 300): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const temporizador = window.setTimeout(() => setAtrasado(valor), espera)
    return () => window.clearTimeout(temporizador)
  }, [valor, espera])
  return atrasado
}
