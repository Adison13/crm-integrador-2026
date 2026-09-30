package br.com.plataforma.crm.empresa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmpresaRepositorio extends JpaRepository<Empresa, UUID> {

    @Query("select e from Empresa e where e.id = :id")
    Optional<Empresa> buscarPorId(UUID id);

    @Query("select e from Empresa e where e.cnpj = :cnpj")
    Optional<Empresa> buscarPorCnpj(String cnpj);

    @Query("select e from Empresa e where e.id in :ids")
    List<Empresa> buscarPorIds(List<UUID> ids);

    @Query("""
            select e from Empresa e
            where lower(e.razaoSocial) like :padrao escape '\\'
               or lower(e.nomeFantasia) like :padrao escape '\\'
               or e.cnpj like :padrao escape '\\'
            order by e.razaoSocial
            """)
    List<Empresa> buscarPorPadrao(@Param("padrao") String padrao, Pageable limite);
}
