package br.com.plataforma.crm.prospeccao;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NovaTentativa(
        @NotNull(message = "Informe o canal da tentativa.")
        @Pattern(regexp = "telefone|email|whatsapp|linkedin|visita",
                message = "Canal deve ser telefone, email, whatsapp, linkedin ou visita.")
        String canal,

        @NotNull(message = "Informe o resultado da tentativa.")
        @Pattern(regexp = "sem_resposta|contato_realizado|retornar_depois|sem_interesse|numero_invalido",
                message = "Resultado deve ser sem_resposta, contato_realizado, retornar_depois, sem_interesse "
                        + "ou numero_invalido.")
        String resultado,

        UUID contatoId,

        @Size(max = 1000, message = "A observação pode ter até 1000 caracteres.")
        String observacao,

        OffsetDateTime realizadaEm) {
}
