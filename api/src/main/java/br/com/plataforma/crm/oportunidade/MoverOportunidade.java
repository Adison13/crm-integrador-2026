package br.com.plataforma.crm.oportunidade;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MoverOportunidade(
        @NotNull(message = "Informe a etapa de destino.")
        UUID etapaId,

        @Size(min = 1, max = 255, message = "O próximo passo pode ter até 255 caracteres.")
        String proximoPasso,

        LocalDate dataProximoPasso) {
}
