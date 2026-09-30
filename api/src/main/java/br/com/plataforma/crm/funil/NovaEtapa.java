package br.com.plataforma.crm.funil;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NovaEtapa(
        @NotBlank(message = "Informe o nome da etapa.")
        @Size(max = 100, message = "O nome da etapa pode ter até 100 caracteres.")
        String nome,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Informe a cor no formato #RRGGBB.")
        String cor) {
}
