package br.com.plataforma.crm.contato;

import java.util.UUID;

public class ContatoDuplicadoException extends RuntimeException {

    private final UUID contatoId;

    public ContatoDuplicadoException(UUID contatoId) {
        super("Já existe contato com este e-mail nesta empresa.");
        this.contatoId = contatoId;
    }

    public UUID getContatoId() {
        return contatoId;
    }
}
