package br.com.plataforma.crm.atividade;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.NaoEncontradoException;
import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.oportunidade.OportunidadeServico;
import br.com.plataforma.crm.oportunidade.Recorte;

/** Atividades e objeções: sempre ligadas a uma oportunidade e com o recorte dela. */
@Service
public class AtividadeServico {

    private static final int OBJECOES_FREQUENTES = 20;

    private final AtividadeRepositorio atividades;
    private final ObjecaoRepositorio objecoes;
    private final OportunidadeServico oportunidades;

    public AtividadeServico(AtividadeRepositorio atividades, ObjecaoRepositorio objecoes,
                            OportunidadeServico oportunidades) {
        this.atividades = atividades;
        this.objecoes = objecoes;
        this.oportunidades = oportunidades;
    }

    @Transactional(readOnly = true)
    public Pagina<AtividadeDto> atividades(UUID oportunidadeId, Recorte recorte, Pageable pagina) {
        oportunidades.visivel(oportunidadeId, recorte);
        return Pagina.de(atividades.daOportunidade(oportunidadeId, pagina), AtividadeDto::de);
    }

    @Transactional
    public AtividadeDto registrar(UUID oportunidadeId, NovaAtividade dados, Recorte recorte) {
        oportunidades.visivel(oportunidadeId, recorte);
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime realizadaEm = dados.realizadaEm() == null ? agora : dados.realizadaEm();
        if (realizadaEm.isAfter(agora.plusMinutes(5))) {
            throw new CampoInvalidoException("realizadaEm", "CAMPO_INVALIDO",
                    "Atividade registra o que já foi feito; para o futuro, crie uma tarefa.");
        }
        return AtividadeDto.de(atividades.save(Atividade.nova(oportunidadeId, dados.tipo(), dados.descricao().strip(),
                realizadaEm, recorte.usuarioId())));
    }

    @Transactional
    public void excluirAtividade(UUID id, Recorte recorte) {
        Atividade a = atividades.buscarPorId(id)
                .orElseThrow(() -> new NaoEncontradoException("Atividade não encontrada."));
        oportunidades.visivel(a.getOportunidadeId(), recorte);
        atividades.delete(a);
    }

    @Transactional(readOnly = true)
    public List<ObjecaoDto> objecoes(UUID oportunidadeId, Recorte recorte) {
        oportunidades.visivel(oportunidadeId, recorte);
        return objecoes.daOportunidade(oportunidadeId).stream().map(ObjecaoDto::de).toList();
    }

    @Transactional
    public ObjecaoDto registrarObjecao(UUID oportunidadeId, NovaObjecao dados, Recorte recorte) {
        oportunidades.visivel(oportunidadeId, recorte);
        return ObjecaoDto.de(objecoes.save(Objecao.nova(oportunidadeId, null, dados.motivo().strip(),
                recorte.usuarioId())));
    }

    @Transactional
    public void excluirObjecao(UUID id, Recorte recorte) {
        Objecao o = objecoes.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException("Objeção não encontrada."));
        oportunidades.visivel(o.getOportunidadeId(), recorte);
        objecoes.delete(o);
    }

    @Transactional(readOnly = true)
    public List<ObjecaoFrequenteDto> frequentes() {
        return objecoes.frequentes(PageRequest.of(0, OBJECOES_FREQUENTES));
    }
}
