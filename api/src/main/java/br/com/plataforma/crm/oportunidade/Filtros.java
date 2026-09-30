package br.com.plataforma.crm.oportunidade;

import java.util.UUID;

public record Filtros(UUID funilId, UUID etapaId, String status, UUID responsavelId, UUID empresaId) {
}
