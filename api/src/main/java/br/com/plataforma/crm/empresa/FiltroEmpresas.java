package br.com.plataforma.crm.empresa;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;

/** Filtros da listagem de empresas e da lista de prospecção. Campos nulos não filtram. */
public record FiltroEmpresas(String segmento, Collection<String> status, String cidade, String porte,
                             UUID vendedorId) {

    Specification<Empresa> especificacao() {
        return (raiz, consulta, cb) -> {
            List<Predicate> condicoes = new ArrayList<>();
            if (segmento != null && !segmento.isBlank()) {
                condicoes.add(cb.equal(cb.lower(raiz.get("segmento")), segmento.strip().toLowerCase()));
            }
            if (status != null && !status.isEmpty()) {
                condicoes.add(raiz.get("statusComercial").in(status));
            }
            if (cidade != null && !cidade.isBlank()) {
                condicoes.add(cb.equal(cb.lower(raiz.get("cidade")), cidade.strip().toLowerCase()));
            }
            if (porte != null && !porte.isBlank()) {
                condicoes.add(cb.equal(cb.lower(raiz.get("porte")), porte.strip().toLowerCase()));
            }
            if (vendedorId != null) {
                condicoes.add(cb.equal(raiz.get("vendedorResponsavel"), vendedorId));
            }
            return cb.and(condicoes.toArray(Predicate[]::new));
        };
    }
}
