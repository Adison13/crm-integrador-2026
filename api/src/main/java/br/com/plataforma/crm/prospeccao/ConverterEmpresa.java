package br.com.plataforma.crm.prospeccao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConverterEmpresa(
        @NotBlank(message = "Informe o título da oportunidade.")
        @Size(max = 255, message = "O título pode ter até 255 caracteres.")
        String titulo,

        UUID contatoId,
        UUID produtoId,

        @DecimalMin(value = "0", message = "O valor de implantação não pode ser negativo.")
        @Digits(integer = 13, fraction = 2, message = "Informe o valor com até 2 casas decimais.")
        BigDecimal valorImplantacao,

        @DecimalMin(value = "0", message = "O MRR não pode ser negativo.")
        @Digits(integer = 13, fraction = 2, message = "Informe o valor com até 2 casas decimais.")
        BigDecimal valorMrr,

        @Min(value = 0, message = "A probabilidade vai de 0 a 100.")
        @Max(value = 100, message = "A probabilidade vai de 0 a 100.")
        Integer probabilidade,

        LocalDate dataPrevistaFechamento,

        @Size(max = 255, message = "O próximo passo pode ter até 255 caracteres.")
        String proximoPasso,

        LocalDate dataProximoPasso,
        UUID responsavelId) {
}
