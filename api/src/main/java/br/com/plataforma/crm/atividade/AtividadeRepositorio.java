package br.com.plataforma.crm.atividade;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AtividadeRepositorio extends JpaRepository<Atividade, UUID> {

    @Query("select a from Atividade a where a.id = :id")
    Optional<Atividade> buscarPorId(@Param("id") UUID id);

    @Query("select a from Atividade a where a.oportunidadeId = :oportunidadeId order by a.realizadaEm desc")
    Page<Atividade> daOportunidade(@Param("oportunidadeId") UUID oportunidadeId, Pageable pagina);
}
