package br.com.plataforma.crm.empresa;

import java.util.UUID;

public record UnidadeDto(UUID id, UUID empresaId, String tipo, String endereco) {

    static UnidadeDto de(Unidade unidade) {
        return new UnidadeDto(unidade.getId(), unidade.getEmpresaId(), unidade.getTipo(), unidade.getEndereco());
    }
}
