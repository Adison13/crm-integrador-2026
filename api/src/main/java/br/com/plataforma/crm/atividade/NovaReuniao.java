package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NovaReuniao(
        @NotNull(message = "Informe a data e a hora da reunião.")
        OffsetDateTime dataHora,

        @Size(max = 2000, message = "Os participantes podem ter até 2000 caracteres.")
        String participantes,

        @Size(max = 255, message = "O local ou link pode ter até 255 caracteres.")
        String localOuLink,

        @Size(max = 2000, message = "A pauta pode ter até 2000 caracteres.")
        String pauta) {
}
