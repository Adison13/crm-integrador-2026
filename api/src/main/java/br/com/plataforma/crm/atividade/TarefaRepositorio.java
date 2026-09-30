package br.com.plataforma.crm.atividade;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TarefaRepositorio extends JpaRepository<Tarefa, UUID>, JpaSpecificationExecutor<Tarefa> {

    @Query("select t from Tarefa t where t.id = :id")
    Optional<Tarefa> buscarPorId(@Param("id") UUID id);

    @Query("""
            select t from Tarefa t
            where t.oportunidadeId = :oportunidadeId
            order by case when t.status = 'pendente' then 0 else 1 end, t.dataVencimento, t.criadoEm
            """)
    List<Tarefa> daOportunidade(@Param("oportunidadeId") UUID oportunidadeId);
}
