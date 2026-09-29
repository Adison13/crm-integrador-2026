package br.com.plataforma.crm.empresa;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EditarEmpresa(
        @NotBlank(message = "Informe a razão social.")
        @Size(max = 255, message = "A razão social pode ter até 255 caracteres.")
        String razaoSocial,

        @Size(max = 255, message = "O nome fantasia pode ter até 255 caracteres.")
        String nomeFantasia,

        @Pattern(regexp = "^[0-9]{14}$", message = "O CNPJ deve ter 14 dígitos, sem formatação.")
        String cnpj,

        String segmento,

        String porte,

        String cidade,

        @Size(max = 2, message = "Informe a sigla do estado, com 2 letras.")
        String estado,

        UUID vendedorResponsavel,

        String statusComercial) {
}
