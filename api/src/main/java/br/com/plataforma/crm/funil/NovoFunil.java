package br.com.plataforma.crm.funil;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record NovoFunil(
        @NotBlank(message = "Informe o nome do funil.")
        @Size(max = 100, message = "O nome do funil pode ter até 100 caracteres.")
        String nome,

        @NotEmpty(message = "Informe ao menos uma etapa.")
        List<@Valid NovaEtapa> etapas) {
}
