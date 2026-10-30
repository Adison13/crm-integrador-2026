/** ResultadoBuscaDto — GET /api/crm/busca?q=, no formato comum da casca (Contrato §8.6). */
export interface ResultadoBuscaDto {
  id: string
  titulo: string
  subtitulo: string
  /** Relativa ao urlFrontend do módulo: /empresas/{id} ou /contatos/{id}. */
  rota: string
}
