package br.com.plataforma.crm.oportunidade;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NovaOportunidade(
        @NotBlank(message = "Informe o título da oportunidade.")
        @Size(max = 255, message = "O título pode ter até 255 caracteres.")
        String titulo,

        @NotNull(message = "Informe a empresa.")
        UUID empresaId,

        UUID contatoId,
        UUID unidadeId,
        UUID etapaId,

        @Pattern(regexp = "nova|upsell|cross_sell", message = "Tipo deve ser nova, upsell ou cross_sell.")
        String tipo,

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
        UUID responsavelId,

        @Size(max = 30, message = "A origem pode ter até 30 caracteres.")
        String origem,

        @Size(max = 100, message = "O identificador de origem pode ter até 100 caracteres.")
        String origemModuloId) {
}
