package br.com.plataforma.crm.atividade;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NovaObjecao(
        @NotBlank(message = "Informe o motivo da objeção.")
        @Size(max = 255, message = "O motivo pode ter até 255 caracteres.")
        String motivo) {
}
