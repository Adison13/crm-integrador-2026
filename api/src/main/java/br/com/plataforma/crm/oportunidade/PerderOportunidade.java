package br.com.plataforma.crm.oportunidade;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PerderOportunidade(
        @NotBlank(message = "Informe o motivo da perda.")
        @Size(max = 255, message = "O motivo pode ter até 255 caracteres.")
        String motivo) {
}
