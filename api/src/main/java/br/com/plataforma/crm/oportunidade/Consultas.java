package br.com.plataforma.crm.oportunidade;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import br.com.plataforma.crm.funil.Etapa;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;

/** Filtros da listagem, sempre combinados com o recorte de dono e equipe. */
public final class Consultas {

    private Consultas() {
    }

    /** Condição do recorte de dono e equipe, reaproveitada em consultas de outros pacotes. */
    public static Predicate visivel(From<?, Oportunidade> raiz, CriteriaBuilder cb, Recorte recorte) {
        List<Predicate> visiveis = new ArrayList<>();
        visiveis.add(cb.isNull(raiz.get("responsavelId")));
        visiveis.add(cb.equal(raiz.get("responsavelId"), recorte.usuarioId()));
        if (!recorte.equipes().isEmpty()) {
            visiveis.add(raiz.get("equipeId").in(recorte.equipes()));
        }
        return cb.or(visiveis.toArray(Predicate[]::new));
    }

    static Specification<Oportunidade> de(Filtros f, Recorte recorte) {
        return (raiz, consulta, cb) -> {
            List<Predicate> condicoes = new ArrayList<>();
            if (!recorte.todas()) {
                condicoes.add(visivel(raiz, cb, recorte));
            }
            if (f.funilId() != null) {
                Subquery<UUID> etapasDoFunil = consulta.subquery(UUID.class);
                var etapa = etapasDoFunil.from(Etapa.class);
                etapasDoFunil.select(etapa.get("id")).where(cb.equal(etapa.get("funilId"), f.funilId()));
                condicoes.add(raiz.get("etapaId").in(etapasDoFunil));
            }
            if (f.etapaId() != null) {
                condicoes.add(cb.equal(raiz.get("etapaId"), f.etapaId()));
            }
            if (f.status() != null) {
                condicoes.add(cb.equal(raiz.get("status"), f.status()));
            }
            if (f.responsavelId() != null) {
                condicoes.add(cb.equal(raiz.get("responsavelId"), f.responsavelId()));
            }
            if (f.empresaId() != null) {
                condicoes.add(cb.equal(raiz.get("empresaId"), f.empresaId()));
            }
            return cb.and(condicoes.toArray(Predicate[]::new));
        };
    }
}
