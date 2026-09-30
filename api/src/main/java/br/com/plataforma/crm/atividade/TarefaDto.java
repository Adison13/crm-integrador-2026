package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record TarefaDto(UUID id, UUID oportunidadeId, String descricao, String tipo, UUID responsavelId,
                        OffsetDateTime dataVencimento, String status, boolean vencida, OffsetDateTime concluidaEm,
                        OffsetDateTime criadoEm) {

    static TarefaDto de(Tarefa t) {
        return new TarefaDto(t.getId(), t.getOportunidadeId(), t.getDescricao(), t.getTipo(), t.getResponsavelId(),
                t.getDataVencimento(), t.getStatus(), t.vencida(OffsetDateTime.now(ZoneOffset.UTC)), t.getConcluidaEm(),
                t.getCriadoEm());
    }
}
