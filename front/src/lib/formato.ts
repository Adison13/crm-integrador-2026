/** Formatação de exibição em pt-BR. Nada aqui altera o valor que vai para a API. */

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const NUMERO_CURTO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const DATA_HORA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const RELATIVO = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const HORA = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' })
const DIA_POR_EXTENSO = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

export function moeda(valor: number | null | undefined) {
  return valor == null ? null : MOEDA.format(valor)
}

/** "R$ 35k", "R$ 1,2 mi" — para cartões e totais de coluna, onde o valor exato não cabe. */
export function moedaCurta(valor: number | null | undefined) {
  if (valor == null) return null
  if (Math.abs(valor) >= 1_000_000) return `R$ ${NUMERO_CURTO.format(valor / 1_000_000)} mi`
  if (Math.abs(valor) >= 1_000) return `R$ ${NUMERO_CURTO.format(valor / 1_000)}k`
  return `R$ ${NUMERO_CURTO.format(valor)}`
}

export const somenteDigitos = (texto: string) => texto.replace(/\D/g, '')

/** 12345678000190 → 12.345.678/0001-90. Parcial enquanto o usuário digita. */
export function cnpj(valor: string | null | undefined) {
  if (!valor) return null
  const d = somenteDigitos(valor).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/** 11992013456 → (11) 99201-3456; 1132104455 → (11) 3210-4455. Outros formatos passam como vieram. */
export function telefone(valor: string | null | undefined) {
  if (!valor) return null
  const d = somenteDigitos(valor)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return valor
}

/** LocalDate "AAAA-MM-DD" → "DD/MM/AAAA", sem passar por Date (que mudaria o dia pelo fuso). */
export function data(valor: string | null | undefined) {
  if (!valor) return null
  const [ano, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** LocalDate "AAAA-MM-DD" → "DD/MM". */
export function dataCurta(valor: string | null | undefined) {
  if (!valor) return null
  const [, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}`
}

export function dataHora(iso: string | null | undefined) {
  return iso ? DATA_HORA.format(new Date(iso)) : null
}

/** Instante ISO → "14:30", no fuso do navegador. */
export function hora(iso: string) {
  return HORA.format(new Date(iso))
}

/** LocalDate "AAAA-MM-DD" → "segunda-feira, 27 de outubro". */
export function diaPorExtenso(valor: string) {
  return DIA_POR_EXTENSO.format(paraDataLocal(valor))
}

/** LocalDate "AAAA-MM-DD" → Date à meia-noite local (new Date("AAAA-MM-DD") seria meia-noite UTC, o dia anterior no Brasil). */
export function paraDataLocal(valor: string) {
  const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

/** Date → LocalDate "AAAA-MM-DD", pelo calendário local. */
export function paraLocalDate(d: Date) {
  const doisDigitos = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`
}

/** "há 5 minutos", "ontem", "há 3 dias". */
export function haQuanto(iso: string | null | undefined) {
  if (!iso) return null
  const segundos = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000], ['month', 2_592_000], ['day', 86_400], ['hour', 3_600], ['minute', 60],
  ]
  for (const [unidade, tamanho] of unidades) {
    if (Math.abs(segundos) >= tamanho) return RELATIVO.format(Math.round(segundos / tamanho), unidade)
  }
  return 'agora'
}

/** Data local de hoje como LocalDate "AAAA-MM-DD", deslocada em dias. */
export function hoje(deslocamentoEmDias = 0) {
  const d = new Date()
  d.setDate(d.getDate() + deslocamentoEmDias)
  return paraLocalDate(d)
}

/** "São Paulo/SP", "São Paulo", "SP" ou nulo. */
export function local(cidade: string | null | undefined, estado: string | null | undefined) {
  if (cidade && estado) return `${cidade}/${estado}`
  return cidade || estado || null
}

/** Primeiro nome, para colunas estreitas. */
export const primeiroNome = (nome: string | null | undefined) => nome?.trim().split(/\s+/)[0] ?? null

/** "48.000,50", "48.000" ou "48000.5" → número; vazio → null; texto que não é número → NaN. */
export function numeroDe(texto: string) {
  const limpo = texto.trim().replace(/\s|R\$/g, '')
  if (!limpo) return null
  const soMilhar = /^\d{1,3}(\.\d{3})+$/.test(limpo)
  const normalizado = limpo.includes(',') || soMilhar ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  return /^\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : Number.NaN
}

/** 48000.5 → "48.000,50", para preencher o campo de valor na edição. */
export function valorParaCampo(valor: number | null | undefined) {
  return valor == null ? '' : valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Instante ISO → "AAAA-MM-DDTHH:mm" no fuso do navegador, o formato do input datetime-local. */
export function paraCampoDataHora(iso: string | Date | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** Valor do datetime-local (sem fuso, lido no fuso do navegador) → instante ISO para a API. */
export function deCampoDataHora(valor: string) {
  return valor ? new Date(valor).toISOString() : null
}
