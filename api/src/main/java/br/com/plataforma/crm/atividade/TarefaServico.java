package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.ConflitoException;
import br.com.plataforma.crm.api.NaoEncontradoException;
import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.oportunidade.OportunidadeServico;
import br.com.plataforma.crm.oportunidade.Recorte;
import jakarta.persistence.criteria.Predicate;

@Service
public class TarefaServico {

    private final TarefaRepositorio tarefas;
    private final OportunidadeServico oportunidades;

    public TarefaServico(TarefaRepositorio tarefas, OportunidadeServico oportunidades) {
        this.tarefas = tarefas;
        this.oportunidades = oportunidades;
    }

    /** Tarefas de um responsável; de outra pessoa só com crm.oportunidade.ver_todas. */
    @Transactional(readOnly = true)
    public Pagina<TarefaDto> doResponsavel(UUID responsavelId, String status, Boolean vencidas, Recorte recorte,
                                           Pageable pagina) {
        UUID responsavel = responsavelId != null ? responsavelId : recorte.usuarioId();
        if (!recorte.todas() && !responsavel.equals(recorte.usuarioId())) {
            throw new AccessDeniedException("Consultar tarefas de outra pessoa exige crm.oportunidade.ver_todas.");
        }
        return Pagina.de(tarefas.findAll(filtro(responsavel, status, Boolean.TRUE.equals(vencidas)), pagina),
                TarefaDto::de);
    }

    @Transactional(readOnly = true)
    public List<TarefaDto> daOportunidade(UUID oportunidadeId, Recorte recorte) {
        oportunidades.visivel(oportunidadeId, recorte);
        return tarefas.daOportunidade(oportunidadeId).stream().map(TarefaDto::de).toList();
    }

    @Transactional
    public TarefaDto criar(NovaTarefa dados, Recorte recorte) {
        if (dados.oportunidadeId() != null && oportunidades.buscarVisivel(dados.oportunidadeId(), recorte).isEmpty()) {
            throw new CampoInvalidoException("oportunidadeId", "OPORTUNIDADE_INEXISTENTE",
                    "Oportunidade não encontrada.");
        }
        UUID responsavel = dados.responsavelId() != null ? dados.responsavelId() : recorte.usuarioId();
        return TarefaDto.de(tarefas.save(Tarefa.nova(dados.oportunidadeId(), dados.descricao().strip(), dados.tipo(),
                responsavel, dados.dataVencimento(), recorte.usuarioId())));
    }

    @Transactional
    public TarefaDto editar(UUID id, EditarTarefa dados, Recorte recorte) {
        Tarefa t = buscar(id, recorte);
        UUID responsavel = dados.responsavelId() != null ? dados.responsavelId() : t.getResponsavelId();
        t.editar(dados.descricao().strip(), dados.tipo(), responsavel, dados.dataVencimento(), recorte.usuarioId());
        return TarefaDto.de(t);
    }

    @Transactional
    public TarefaDto concluir(UUID id, Recorte recorte) {
        Tarefa t = buscar(id, recorte);
        if (!t.estaPendente()) {
            throw new ConflitoException("TAREFA_CONCLUIDA", "Esta tarefa já foi concluída.",
                    "Crie uma nova tarefa se ainda houver o que fazer.");
        }
        t.concluir(recorte.usuarioId());
        return TarefaDto.de(t);
    }

    @Transactional
    public void excluir(UUID id, Recorte recorte) {
        tarefas.delete(buscar(id, recorte));
    }

    private Tarefa buscar(UUID id, Recorte recorte) {
        return tarefas.buscarPorId(id).filter(t -> enxerga(t, recorte))
                .orElseThrow(() -> new NaoEncontradoException("Tarefa não encontrada."));
    }

    private boolean enxerga(Tarefa t, Recorte recorte) {
        if (recorte.todas() || recorte.usuarioId().equals(t.getResponsavelId())
                || recorte.usuarioId().equals(t.getCriadoPor())) {
            return true;
        }
        return t.getOportunidadeId() != null
                && oportunidades.buscarVisivel(t.getOportunidadeId(), recorte).isPresent();
    }

    private static Specification<Tarefa> filtro(UUID responsavel, String status, boolean vencidas) {
        return (raiz, consulta, cb) -> {
            List<Predicate> condicoes = new ArrayList<>();
            condicoes.add(cb.equal(raiz.get("responsavelId"), responsavel));
            if (vencidas) {
                condicoes.add(cb.equal(raiz.get("status"), Tarefa.PENDENTE));
                condicoes.add(cb.lessThan(raiz.get("dataVencimento"), OffsetDateTime.now(ZoneOffset.UTC)));
            } else if (status != null) {
                condicoes.add(cb.equal(raiz.get("status"), status));
            }
            consulta.orderBy(
                    cb.asc(cb.<Integer>selectCase().when(cb.isNull(raiz.get("dataVencimento")), 1).otherwise(0)),
                    cb.asc(raiz.get("dataVencimento")),
                    cb.asc(raiz.get("criadoEm")));
            return cb.and(condicoes.toArray(Predicate[]::new));
        };
    }
}
