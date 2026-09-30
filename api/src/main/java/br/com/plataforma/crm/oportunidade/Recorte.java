package br.com.plataforma.crm.oportunidade;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import br.com.plataforma.crm.seguranca.Usuarios;

/**
 * Quem pode ver quais oportunidades (Contrato §5.3 e §5.4): o responsável, as equipes do claim
 * {@code equipes} e, para triagem, as ainda sem responsável. Com crm.oportunidade.ver_todas ou
 * com token de serviço, sem recorte.
 */
public record Recorte(boolean todas, UUID usuarioId, List<UUID> equipes) {

    static final String VER_TODAS = "crm.oportunidade.ver_todas";

    public static Recorte de(Jwt jwt, Authentication autenticacao) {
        UUID usuario = Usuarios.idDe(jwt);
        boolean todas = usuario == null || autenticacao.getAuthorities().stream()
                .anyMatch(a -> VER_TODAS.equals(a.getAuthority()));
        List<String> claim = jwt.getClaimAsStringList("equipes");
        List<UUID> equipes = claim == null ? List.of() : claim.stream().map(UUID::fromString).toList();
        return new Recorte(todas, usuario, equipes);
    }

    boolean enxerga(Oportunidade o) {
        return todas
                || o.getResponsavelId() == null
                || o.getResponsavelId().equals(usuarioId)
                || (o.getEquipeId() != null && equipes.contains(o.getEquipeId()));
    }

    /** Equipe gravada quando o responsável é o próprio usuário e ele está em uma equipe só. */
    UUID equipePara(UUID responsavelId) {
        return responsavelId != null && responsavelId.equals(usuarioId) && equipes.size() == 1 ? equipes.get(0) : null;
    }
}
