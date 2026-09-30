package br.com.plataforma.crm.oportunidade;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Campos comerciais já validados, comuns à criação e à edição. */
public record DadosComerciais(
        String titulo,
        UUID empresaId,
        UUID contatoId,
        UUID unidadeId,
        String tipo,
        UUID produtoId,
        BigDecimal valorImplantacao,
        BigDecimal valorMrr,
        Integer probabilidade,
        LocalDate dataPrevistaFechamento,
        String proximoPasso,
        LocalDate dataProximoPasso,
        UUID responsavelId) {
}
