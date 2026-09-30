package br.com.plataforma.crm.contato;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContatoRepositorio extends JpaRepository<Contato, UUID> {

    @Query("select c from Contato c where c.id = :id")
    Optional<Contato> buscarPorId(@Param("id") UUID id);

    @Query("select c from Contato c where c.id in :ids")
    List<Contato> buscarPorIds(@Param("ids") List<UUID> ids);

    @Query("select c from Contato c where c.empresaId = :empresaId and c.email = :email")
    Optional<Contato> buscarPorEmail(@Param("empresaId") UUID empresaId, @Param("email") String email);

    @Query("select c from Contato c where c.empresaId = :empresaId")
    Page<Contato> daEmpresa(@Param("empresaId") UUID empresaId, Pageable pagina);

    @Query("""
            select c from Contato c
            where lower(c.nome) like :padrao escape '\\'
               or lower(c.email) like :padrao escape '\\'
            order by c.nome
            """)
    List<Contato> buscarPorPadrao(@Param("padrao") String padrao, Pageable limite);
}
