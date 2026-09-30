package br.com.plataforma.crm.funil;

import java.util.List;
import java.util.UUID;

public record FunilDto(UUID id, String nome, boolean padrao, List<EtapaDto> etapas) {

    static FunilDto de(Funil funil, List<Etapa> etapas) {
        return new FunilDto(funil.getId(), funil.getNome(), funil.isPadrao(), etapas.stream().map(EtapaDto::de).toList());
    }
}
