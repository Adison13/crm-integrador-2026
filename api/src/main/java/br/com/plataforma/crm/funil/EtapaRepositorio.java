package br.com.plataforma.crm.funil;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EtapaRepositorio extends JpaRepository<Etapa, UUID> {

    @Query("select e from Etapa e where e.id = :id")
    Optional<Etapa> buscarPorId(@Param("id") UUID id);

    @Query("select e from Etapa e where e.id in :ids")
    List<Etapa> buscarPorIds(@Param("ids") Collection<UUID> ids);

    @Query("select e from Etapa e where e.funilId = :funilId order by e.ordem")
    List<Etapa> doFunil(@Param("funilId") UUID funilId);

    @Query("select e from Etapa e where e.funilId in :funilIds order by e.ordem")
    List<Etapa> dosFunis(@Param("funilIds") Collection<UUID> funilIds);

    @Query("select coalesce(max(e.ordem), 0) from Etapa e where e.funilId = :funilId")
    int maiorOrdem(@Param("funilId") UUID funilId);
}
