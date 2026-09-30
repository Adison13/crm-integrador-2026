package br.com.plataforma.crm.atividade;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.ConflitoException;
import br.com.plataforma.crm.api.NaoEncontradoException;
import br.com.plataforma.crm.oportunidade.Consultas;
import br.com.plataforma.crm.oportunidade.Oportunidade;
import br.com.plataforma.crm.oportunidade.OportunidadeServico;
import br.com.plataforma.crm.oportunidade.Recorte;
import jakarta.persistence.criteria.Subquery;

@Service
public class ReuniaoServico {

    static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    static final int MAXIMO_DE_DIAS = 62;

    private final ReuniaoRepositorio reunioes;
    private final ObjecaoRepositorio objecoes;
    private final OportunidadeServico oportunidades;

    public ReuniaoServico(ReuniaoRepositorio reunioes, ObjecaoRepositorio objecoes, OportunidadeServico oportunidades) {
        this.reunioes = reunioes;
        this.objecoes = objecoes;
        this.oportunidades = oportunidades;
    }

    /** Agenda: reuniões das oportunidades que o usuário enxerga, de um dia a outro, inclusive. */
    @Transactional(readOnly = true)
    public List<ReuniaoDto> agenda(LocalDate de, LocalDate ate, Recorte recorte) {
        if (ate.isBefore(de)) {
            throw new CampoInvalidoException("ate", "CAMPO_INVALIDO", "A data final não pode ser antes da inicial.");
        }
        if (ChronoUnit.DAYS.between(de, ate) >= MAXIMO_DE_DIAS) {
            throw new CampoInvalidoException("ate", "CAMPO_INVALIDO",
                    "Consulte no máximo " + MAXIMO_DE_DIAS + " dias por vez.");
        }
        OffsetDateTime inicio = de.atStartOfDay(FUSO).toOffsetDateTime();
        OffsetDateTime fim = ate.plusDays(1).atStartOfDay(FUSO).toOffsetDateTime();
        Specification<Reuniao> periodo = (raiz, consulta, cb) -> {
            var dentro = cb.and(cb.greaterThanOrEqualTo(raiz.get("dataHora"), inicio),
                    cb.lessThan(raiz.get("dataHora"), fim));
            if (recorte.todas()) {
                return dentro;
            }
            Subquery<UUID> visiveis = consulta.subquery(UUID.class);
            var oportunidade = visiveis.from(Oportunidade.class);
            visiveis.select(oportunidade.get("id")).where(Consultas.visivel(oportunidade, cb, recorte));
            return cb.and(dentro, raiz.get("oportunidadeId").in(visiveis));
        };
        return reunioes.findAll(periodo, Sort.by("dataHora")).stream().map(ReuniaoDto::de).toList();
    }

    @Transactional(readOnly = true)
    public List<ReuniaoDto> daOportunidade(UUID oportunidadeId, Recorte recorte) {
        oportunidades.visivel(oportunidadeId, recorte);
        return reunioes.daOportunidade(oportunidadeId).stream().map(ReuniaoDto::de).toList();
    }

    @Transactional
    public ReuniaoDto agendar(UUID oportunidadeId, NovaReuniao dados, Recorte recorte) {
        Oportunidade o = oportunidades.visivel(oportunidadeId, recorte);
        if (!o.estaAberta()) {
            throw new ConflitoException("OPORTUNIDADE_FECHADA", "Esta oportunidade já foi fechada.",
                    "Não é possível agendar reunião em oportunidade ganha ou perdida.");
        }
        return ReuniaoDto.de(reunioes.save(Reuniao.nova(oportunidadeId, dados.dataHora(), texto(dados.participantes()),
                texto(dados.localOuLink()), texto(dados.pauta()), recorte.usuarioId())));
    }

    @Transactional
    public ReuniaoDto reagendar(UUID id, NovaReuniao dados, Recorte recorte) {
        Reuniao r = buscarNaoRegistrada(id, recorte);
        r.reagendar(dados.dataHora(), texto(dados.participantes()), texto(dados.localOuLink()), texto(dados.pauta()),
                recorte.usuarioId());
        return ReuniaoDto.de(r);
    }

    @Transactional
    public void cancelar(UUID id, Recorte recorte) {
        reunioes.delete(buscarNaoRegistrada(id, recorte));
    }

    /** Registro pós-reunião: resumo, próximo passo da oportunidade e objeções levantadas. */
    @Transactional
    public ReuniaoDto registrar(UUID id, RegistroReuniao dados, Recorte recorte) {
        Reuniao r = buscarNaoRegistrada(id, recorte);
        String proximoPasso = dados.proximoPasso().strip();
        r.registrar(dados.resumo().strip(), proximoPasso, recorte.usuarioId());
        oportunidades.definirProximoPasso(r.getOportunidadeId(), recorte, proximoPasso, dados.dataProximoPasso());
        if (dados.objecoes() != null) {
            for (String motivo : dados.objecoes()) {
                objecoes.save(Objecao.nova(r.getOportunidadeId(), r.getId(), motivo.strip(), recorte.usuarioId()));
            }
        }
        return ReuniaoDto.de(r);
    }

    private Reuniao buscarNaoRegistrada(UUID id, Recorte recorte) {
        Reuniao r = reunioes.buscarPorId(id)
                .filter(reuniao -> oportunidades.buscarVisivel(reuniao.getOportunidadeId(), recorte).isPresent())
                .orElseThrow(() -> new NaoEncontradoException("Reunião não encontrada."));
        if (r.registrada()) {
            throw new ConflitoException("REUNIAO_REGISTRADA", "Esta reunião já foi registrada.",
                    "Reunião registrada não pode ser alterada nem cancelada.");
        }
        return r;
    }

    private static String texto(String valor) {
        return valor == null || valor.isBlank() ? null : valor.strip();
    }
}
