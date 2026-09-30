package br.com.plataforma.crm.contato;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ContatoDto(
        UUID id,
        UUID empresaId,
        String nome,
        String cargo,
        String email,
        String telefone,
        String papel,
        String consentimentoLgpd,
        String preferenciaComunicacao,
        String origem,
        String origemModuloId,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        OffsetDateTime criadoEm) {

    static ContatoDto de(Contato contato) {
        return new ContatoDto(
                contato.getId(),
                contato.getEmpresaId(),
                contato.getNome(),
                contato.getCargo(),
                contato.getEmail(),
                contato.getTelefone(),
                contato.getPapel(),
                contato.getConsentimentoLgpd(),
                contato.getPreferenciaComunicacao(),
                contato.getOrigem(),
                contato.getOrigemModuloId(),
                contato.getUtmSource(),
                contato.getUtmMedium(),
                contato.getUtmCampaign(),
                contato.getCriadoEm());
    }
}
