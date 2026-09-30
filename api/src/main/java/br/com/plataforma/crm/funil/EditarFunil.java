package br.com.plataforma.crm.funil;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditarFunil(
        @NotBlank(message = "Informe o nome do funil.")
        @Size(max = 100, message = "O nome do funil pode ter até 100 caracteres.")
        String nome,

        Boolean padrao) {
}
