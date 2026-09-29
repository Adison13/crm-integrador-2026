package br.com.plataforma.crm.busca;

import java.util.UUID;

/** Item da busca global, no formato comum a todos os módulos. */
public record ResultadoBuscaDto(UUID id, String titulo, String subtitulo, String rota) {
}
