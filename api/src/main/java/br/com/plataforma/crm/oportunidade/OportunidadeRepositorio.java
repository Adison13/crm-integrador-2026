package br.com.plataforma.crm.oportunidade;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OportunidadeRepositorio extends JpaRepository<Oportunidade, UUID>, JpaSpecificationExecutor<Oportunidade> {

    @Query("select o from Oportunidade o where o.id = :id")
    Optional<Oportunidade> buscarPorId(@Param("id") UUID id);

    @Query("select count(o) from Oportunidade o where o.etapaId = :etapaId")
    long contarNaEtapa(@Param("etapaId") UUID etapaId);

    @Query("""
            select count(o) from Oportunidade o
            where o.etapaId in (select e.id from Etapa e where e.funilId = :funilId)
            """)
    long contarNoFunil(@Param("funilId") UUID funilId);
}
