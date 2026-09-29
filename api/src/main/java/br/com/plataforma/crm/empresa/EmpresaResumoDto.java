package br.com.plataforma.crm.empresa;

import java.util.UUID;

public record EmpresaResumoDto(UUID id, String razaoSocial, String cnpj, String cidade) {

    static EmpresaResumoDto de(Empresa empresa) {
        return new EmpresaResumoDto(empresa.getId(), empresa.getRazaoSocial(), empresa.getCnpj(), empresa.getCidade());
    }
}
