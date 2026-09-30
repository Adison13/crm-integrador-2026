package br.com.plataforma.crm.atividade;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ObjecaoRepositorio extends JpaRepository<Objecao, UUID> {

    @Query("select o from Objecao o where o.id = :id")
    Optional<Objecao> buscarPorId(@Param("id") UUID id);

    @Query("select o from Objecao o where o.oportunidadeId = :oportunidadeId order by o.criadoEm desc")
    List<Objecao> daOportunidade(@Param("oportunidadeId") UUID oportunidadeId);

    @Query("""
            select new br.com.plataforma.crm.atividade.ObjecaoFrequenteDto(lower(o.motivo), count(o))
            from Objecao o
            group by lower(o.motivo)
            order by count(o) desc, lower(o.motivo)
            """)
    List<ObjecaoFrequenteDto> frequentes(Pageable limite);
}
