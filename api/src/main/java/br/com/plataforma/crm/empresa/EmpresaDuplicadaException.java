package br.com.plataforma.crm.empresa;

import java.util.UUID;

public class EmpresaDuplicadaException extends RuntimeException {

    private final UUID empresaId;

    public EmpresaDuplicadaException(UUID empresaId) {
        super("Já existe empresa com este CNPJ.");
        this.empresaId = empresaId;
    }

    public UUID getEmpresaId() {
        return empresaId;
    }
}
