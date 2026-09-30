package br.com.plataforma.crm.funil;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FunilRepositorio extends JpaRepository<Funil, UUID> {

    @Query("select f from Funil f where f.id = :id")
    Optional<Funil> buscarPorId(@Param("id") UUID id);

    @Query("select f from Funil f order by f.padrao desc, f.criadoEm")
    List<Funil> todos();

    @Query("select f from Funil f where f.padrao = true")
    Optional<Funil> padrao();
}
