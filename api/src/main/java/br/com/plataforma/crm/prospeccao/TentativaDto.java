package br.com.plataforma.crm.prospeccao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TentativaDto(UUID id, UUID empresaId, UUID contatoId, String canal, String resultado, String observacao,
                           OffsetDateTime realizadaEm, UUID responsavelId) {

    static TentativaDto de(Tentativa t) {
        return new TentativaDto(t.getId(), t.getEmpresaId(), t.getContatoId(), t.getCanal(), t.getResultado(),
                t.getObservacao(), t.getRealizadaEm(), t.getResponsavelId());
    }
}
