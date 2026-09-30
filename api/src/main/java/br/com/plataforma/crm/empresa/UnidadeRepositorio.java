package br.com.plataforma.crm.empresa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UnidadeRepositorio extends JpaRepository<Unidade, UUID> {

    @Query("""
            select u from Unidade u
            where u.empresaId = :empresaId
            order by case when u.tipo = 'matriz' then 0 else 1 end, u.criadoEm
            """)
    List<Unidade> daEmpresa(@Param("empresaId") UUID empresaId);
}
