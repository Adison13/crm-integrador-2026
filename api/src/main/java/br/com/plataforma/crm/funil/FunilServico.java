package br.com.plataforma.crm.funil;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.ConflitoException;
import br.com.plataforma.crm.api.NaoEncontradoException;
import br.com.plataforma.crm.oportunidade.OportunidadeRepositorio;

@Service
public class FunilServico {

    static final String NOME_PADRAO = "Vendas";

    /** Funil real da Centinela (Documentação de Requisitos, seção 2.5 e RF-CRM-01). */
    static final List<NovaEtapa> ETAPAS_PADRAO = List.of(
            new NovaEtapa("Captação", "#6B7280"),
            new NovaEtapa("Qualificação", "#2563EB"),
            new NovaEtapa("Diagnóstico Gratuito", "#0E9F8E"),
            new NovaEtapa("Proposta", "#D97706"),
            new NovaEtapa("Negociação", "#7C3AED"));

    private final FunilRepositorio funis;
    private final EtapaRepositorio etapas;
    private final OportunidadeRepositorio oportunidades;

    public FunilServico(FunilRepositorio funis, EtapaRepositorio etapas, OportunidadeRepositorio oportunidades) {
        this.funis = funis;
        this.etapas = etapas;
        this.oportunidades = oportunidades;
    }

    /** Todos os funis, com as etapas. Cria o funil padrão na primeira vez que o tenant acessa. */
    @Transactional
    public List<FunilDto> listar(UUID usuario) {
        garantirPadrao(usuario);
        List<Funil> todos = funis.todos();
        Map<UUID, List<Etapa>> porFunil = etapas.dosFunis(todos.stream().map(Funil::getId).toList()).stream()
                .collect(Collectors.groupingBy(Etapa::getFunilId));
        return todos.stream().map(f -> FunilDto.de(f, porFunil.getOrDefault(f.getId(), List.of()))).toList();
    }

    @Transactional(readOnly = true)
    public FunilDto ver(UUID id) {
        Funil funil = buscar(id);
        return FunilDto.de(funil, etapas.doFunil(id));
    }

    @Transactional
    public FunilDto criar(NovoFunil dados, UUID usuario) {
        garantirPadrao(usuario);
        Funil funil = funis.save(Funil.novo(dados.nome().strip(), false, usuario));
        criarEtapas(funil.getId(), dados.etapas(), usuario);
        return FunilDto.de(funil, etapas.doFunil(funil.getId()));
    }

    @Transactional
    public FunilDto editar(UUID id, EditarFunil dados, UUID usuario) {
        Funil funil = buscar(id);
        funil.renomear(dados.nome().strip(), usuario);
        if (Boolean.TRUE.equals(dados.padrao()) && !funil.isPadrao()) {
            funis.padrao().ifPresent(anterior -> anterior.definirPadrao(false, usuario));
            funis.flush();
            funil.definirPadrao(true, usuario);
        }
        return FunilDto.de(funil, etapas.doFunil(id));
    }

    @Transactional
    public void excluir(UUID id) {
        Funil funil = buscar(id);
        if (funil.isPadrao()) {
            throw new ConflitoException("FUNIL_PADRAO", "O funil padrão não pode ser excluído.",
                    "Marque outro funil como padrão antes de excluir este.");
        }
        if (oportunidades.contarNoFunil(id) > 0) {
            throw new ConflitoException("FUNIL_COM_OPORTUNIDADES", "Este funil ainda tem oportunidades.",
                    "Mova as oportunidades para outro funil antes de excluí-lo.");
        }
        etapas.deleteAll(etapas.doFunil(id));
        funis.delete(funil);
    }

    @Transactional
    public EtapaDto criarEtapa(UUID funilId, NovaEtapa dados, UUID usuario) {
        buscar(funilId);
        Etapa etapa = etapas.save(Etapa.nova(funilId, dados.nome().strip(), dados.cor(),
                etapas.maiorOrdem(funilId) + 1, usuario));
        return EtapaDto.de(etapa);
    }

    @Transactional
    public FunilDto reordenar(UUID funilId, OrdemEtapas dados, UUID usuario) {
        Funil funil = buscar(funilId);
        List<Etapa> atuais = etapas.doFunil(funilId);
        var idsAtuais = atuais.stream().map(Etapa::getId).collect(Collectors.toSet());
        if (dados.etapaIds().size() != atuais.size() || !idsAtuais.equals(new HashSet<>(dados.etapaIds()))) {
            throw new CampoInvalidoException("etapaIds", "ETAPAS_INCOMPLETAS",
                    "Informe todas as etapas do funil, cada uma uma única vez.");
        }
        Map<UUID, Etapa> porId = atuais.stream().collect(Collectors.toMap(Etapa::getId, e -> e));
        for (int i = 0; i < dados.etapaIds().size(); i++) {
            porId.get(dados.etapaIds().get(i)).posicionar(i + 1, usuario);
        }
        etapas.flush();
        return FunilDto.de(funil, etapas.doFunil(funilId));
    }

    @Transactional
    public EtapaDto editarEtapa(UUID id, NovaEtapa dados, UUID usuario) {
        Etapa etapa = buscarEtapa(id);
        etapa.editar(dados.nome().strip(), dados.cor(), usuario);
        return EtapaDto.de(etapa);
    }

    @Transactional
    public void excluirEtapa(UUID id, UUID usuario) {
        Etapa etapa = buscarEtapa(id);
        if (oportunidades.contarNaEtapa(id) > 0) {
            throw new ConflitoException("ETAPA_COM_OPORTUNIDADES", "Esta etapa ainda tem oportunidades.",
                    "Mova as oportunidades antes de remover a etapa.");
        }
        List<Etapa> doFunil = etapas.doFunil(etapa.getFunilId());
        if (doFunil.size() == 1) {
            throw new ConflitoException("ULTIMA_ETAPA", "O funil precisa de ao menos uma etapa.",
                    "Crie outra etapa antes de remover esta.");
        }
        etapas.delete(etapa);
        int ordem = 1;
        for (Etapa restante : doFunil) {
            if (!restante.getId().equals(id)) {
                restante.posicionar(ordem++, usuario);
            }
        }
    }

    /** Primeira etapa do funil padrão, destino de oportunidade criada sem etapa. */
    @Transactional
    public Etapa etapaInicialPadrao(UUID usuario) {
        Funil padrao = garantirPadrao(usuario);
        return etapas.doFunil(padrao.getId()).get(0);
    }

    @Transactional(readOnly = true)
    public Etapa buscarEtapa(UUID id) {
        return etapas.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException("Etapa não encontrada."));
    }

    private Funil buscar(UUID id) {
        return funis.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException("Funil não encontrado."));
    }

    private Funil garantirPadrao(UUID usuario) {
        return funis.padrao().orElseGet(() -> {
            Funil funil = funis.save(Funil.novo(NOME_PADRAO, true, usuario));
            criarEtapas(funil.getId(), ETAPAS_PADRAO, usuario);
            funis.flush();
            return funil;
        });
    }

    private void criarEtapas(UUID funilId, List<NovaEtapa> novas, UUID usuario) {
        int ordem = 1;
        for (NovaEtapa nova : novas) {
            etapas.save(Etapa.nova(funilId, nova.nome().strip(), nova.cor(), ordem++, usuario));
        }
        etapas.flush();
    }
}
