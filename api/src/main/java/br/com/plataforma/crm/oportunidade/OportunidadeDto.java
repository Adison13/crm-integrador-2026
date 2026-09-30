package br.com.plataforma.crm.oportunidade;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record OportunidadeDto(
        UUID id,
        String titulo,
        UUID empresaId,
        UUID contatoId,
        UUID unidadeId,
        UUID funilId,
        UUID etapaId,
        String tipo,
        UUID produtoId,
        BigDecimal valorImplantacao,
        BigDecimal valorMrr,
        Integer probabilidade,
        LocalDate dataPrevistaFechamento,
        String proximoPasso,
        LocalDate dataProximoPasso,
        boolean proximoPassoAtrasado,
        UUID responsavelId,
        UUID equipeId,
        String status,
        String motivoPerda,
        OffsetDateTime fechadaEm,
        String origem,
        String origemModuloId,
        OffsetDateTime criadoEm) {

    static OportunidadeDto de(Oportunidade o, UUID funilId, LocalDate hoje) {
        return new OportunidadeDto(o.getId(), o.getTitulo(), o.getEmpresaId(), o.getContatoId(), o.getUnidadeId(),
                funilId, o.getEtapaId(), o.getTipo(), o.getProdutoId(), o.getValorImplantacao(), o.getValorMrr(),
                o.getProbabilidade(), o.getDataPrevistaFechamento(), o.getProximoPasso(), o.getDataProximoPasso(),
                o.proximoPassoAtrasado(hoje), o.getResponsavelId(), o.getEquipeId(), o.getStatus(), o.getMotivoPerda(),
                o.getFechadaEm(), o.getOrigem(), o.getOrigemModuloId(), o.getCriadoEm());
    }
}
