package br.com.plataforma.crm.prospeccao;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TentativaRepositorio extends JpaRepository<Tentativa, UUID> {

    @Query("select t from Tentativa t where t.id = :id")
    Optional<Tentativa> buscarPorId(@Param("id") UUID id);

    @Query("select t from Tentativa t where t.empresaId = :empresaId order by t.realizadaEm desc")
    Page<Tentativa> daEmpresa(@Param("empresaId") UUID empresaId, Pageable pagina);

    @Query("select t from Tentativa t where t.empresaId in :empresas order by t.realizadaEm desc")
    List<Tentativa> dasEmpresas(@Param("empresas") List<UUID> empresas);
}
