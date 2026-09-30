package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReuniaoDto(UUID id, UUID oportunidadeId, OffsetDateTime dataHora, String participantes,
                         String localOuLink, String pauta, boolean registrada, String resumo, String proximoPasso,
                         OffsetDateTime registradaEm) {

    static ReuniaoDto de(Reuniao r) {
        return new ReuniaoDto(r.getId(), r.getOportunidadeId(), r.getDataHora(), r.getParticipantes(),
                r.getLocalOuLink(), r.getPauta(), r.registrada(), r.getResumo(), r.getProximoPasso(),
                r.getRegistradaEm());
    }
}
