package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NovaTarefa(
        @NotBlank(message = "Descreva a tarefa.")
        @Size(max = 500, message = "A descrição pode ter até 500 caracteres.")
        String descricao,

        @Pattern(regexp = "ligacao|email|whatsapp|visita|reuniao|follow_up|outro",
                message = "Tipo deve ser ligacao, email, whatsapp, visita, reuniao, follow_up ou outro.")
        String tipo,

        UUID oportunidadeId,
        UUID responsavelId,
        OffsetDateTime dataVencimento) {
}
