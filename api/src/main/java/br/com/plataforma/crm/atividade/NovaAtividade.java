package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NovaAtividade(
        @NotNull(message = "Informe o tipo da atividade.")
        @Pattern(regexp = "ligacao|email|whatsapp|visita|outro",
                message = "Tipo deve ser ligacao, email, whatsapp, visita ou outro.")
        String tipo,

        @NotBlank(message = "Descreva a atividade.")
        @Size(max = 2000, message = "A descrição pode ter até 2000 caracteres.")
        String descricao,

        OffsetDateTime realizadaEm) {
}
