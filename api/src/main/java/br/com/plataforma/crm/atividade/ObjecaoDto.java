package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ObjecaoDto(UUID id, UUID oportunidadeId, UUID reuniaoId, String motivo, OffsetDateTime criadoEm) {

    static ObjecaoDto de(Objecao o) {
        return new ObjecaoDto(o.getId(), o.getOportunidadeId(), o.getReuniaoId(), o.getMotivo(), o.getCriadoEm());
    }
}
