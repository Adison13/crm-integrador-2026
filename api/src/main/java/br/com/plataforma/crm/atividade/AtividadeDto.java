package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AtividadeDto(UUID id, UUID oportunidadeId, String tipo, String descricao, OffsetDateTime realizadaEm,
                           UUID responsavelId) {

    static AtividadeDto de(Atividade a) {
        return new AtividadeDto(a.getId(), a.getOportunidadeId(), a.getTipo(), a.getDescricao(), a.getRealizadaEm(),
                a.getResponsavelId());
    }
}
