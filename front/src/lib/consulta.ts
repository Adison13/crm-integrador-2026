/**
 * Query string a partir de um objeto, sem os vazios — o back-end trata parâmetro ausente como
 * "não filtra" (FiltroEmpresas, Filtros). Lista vira "a,b,c", como o @RequestParam List<UUID> lê.
 */
export function consulta(parametros: Record<string, string | number | boolean | string[] | null | undefined>) {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor === null || valor === undefined || valor === '') continue
    if (Array.isArray(valor)) {
      if (valor.length > 0) busca.set(chave, valor.join(','))
    } else {
      busca.set(chave, String(valor))
    }
  }
  const texto = busca.toString()
  return texto ? `?${texto}` : ''
}

/**
 * Corpo JSON sem as propriedades nulas. Para os records do back-end, ausente e null são a mesma
 * coisa; já o crm.yaml declara enums como [string, 'null'] sem null na lista, e um validador do
 * contrato recusaria o null explícito. Omitir atende aos dois.
 */
export function corpo(dados: object) {
  return JSON.stringify(dados, (_chave, valor: unknown) => (valor === null ? undefined : valor))
}
