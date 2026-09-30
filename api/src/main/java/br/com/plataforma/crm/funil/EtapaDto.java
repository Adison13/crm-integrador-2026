package br.com.plataforma.crm.funil;

import java.util.UUID;

public record EtapaDto(UUID id, UUID funilId, String nome, int ordem, String cor) {

    static EtapaDto de(Etapa etapa) {
        return new EtapaDto(etapa.getId(), etapa.getFunilId(), etapa.getNome(), etapa.getOrdem(), etapa.getCor());
    }
}
