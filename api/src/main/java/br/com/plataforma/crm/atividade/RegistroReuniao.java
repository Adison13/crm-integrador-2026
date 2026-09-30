package br.com.plataforma.crm.atividade;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegistroReuniao(
        @NotBlank(message = "Informe o resumo da reunião.")
        @Size(max = 4000, message = "O resumo pode ter até 4000 caracteres.")
        String resumo,

        @NotBlank(message = "Informe o próximo passo.")
        @Size(max = 255, message = "O próximo passo pode ter até 255 caracteres.")
        String proximoPasso,

        @NotNull(message = "Informe a data do próximo passo.")
        LocalDate dataProximoPasso,

        @Size(max = 20, message = "Informe até 20 objeções por reunião.")
        List<@NotBlank(message = "A objeção não pode ficar vazia.")
             @Size(max = 255, message = "Cada objeção pode ter até 255 caracteres.") String> objecoes) {
}
