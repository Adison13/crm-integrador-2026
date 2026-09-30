package br.com.plataforma.crm.contato;

import java.util.UUID;

public record ContatoResumoDto(UUID id, String nome, String cargo, String email, String telefone) {

    static ContatoResumoDto de(Contato contato) {
        return new ContatoResumoDto(contato.getId(), contato.getNome(), contato.getCargo(), contato.getEmail(),
                contato.getTelefone());
    }
}
