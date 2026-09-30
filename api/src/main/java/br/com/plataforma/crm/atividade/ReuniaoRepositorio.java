package br.com.plataforma.crm.atividade;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReuniaoRepositorio extends JpaRepository<Reuniao, UUID>, JpaSpecificationExecutor<Reuniao> {

    @Query("select r from Reuniao r where r.id = :id")
    Optional<Reuniao> buscarPorId(@Param("id") UUID id);

    @Query("select r from Reuniao r where r.oportunidadeId = :oportunidadeId order by r.dataHora desc")
    List<Reuniao> daOportunidade(@Param("oportunidadeId") UUID oportunidadeId);
}
