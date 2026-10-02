package br.com.plataforma.crm.prospeccao;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.ConflitoException;
import br.com.plataforma.crm.api.NaoEncontradoException;
import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.contato.ContatoRepositorio;
import br.com.plataforma.crm.empresa.Empresa;
import br.com.plataforma.crm.empresa.EmpresaServico;
import br.com.plataforma.crm.empresa.FiltroEmpresas;
import br.com.plataforma.crm.oportunidade.NovaOportunidade;
import br.com.plataforma.crm.oportunidade.OportunidadeDto;
import br.com.plataforma.crm.oportunidade.OportunidadeServico;
import br.com.plataforma.crm.oportunidade.Recorte;

/**
 * Prospecção (RF-CRM-08 e 09): a lista é uma consulta sobre as empresas em lead ou prospect,
 * acompanhada das tentativas de contato; a conversão cria a oportunidade a partir da empresa.
 */
@Service
public class ProspeccaoServico {

    static final List<String> STATUS_EM_PROSPECCAO = List.of(Empresa.LEAD, Empresa.PROSPECT);
    static final String ORIGEM = "prospeccao";

    private final EmpresaServico empresas;
    private final TentativaRepositorio tentativas;
    private final ContatoRepositorio contatos;
    private final OportunidadeServico oportunidades;

    public ProspeccaoServico(EmpresaServico empresas, TentativaRepositorio tentativas, ContatoRepositorio contatos,
                             OportunidadeServico oportunidades) {
        this.empresas = empresas;
        this.tentativas = tentativas;
        this.contatos = contatos;
        this.oportunidades = oportunidades;
    }

    @Transactional(readOnly = true)
    public Pagina<ItemProspeccao> listar(FiltroEmpresas filtro, Pageable pagina) {
        Page<Empresa> pagEmpresas = empresas.listar(filtro, pagina);
        List<UUID> ids = pagEmpresas.getContent().stream().map(Empresa::getId).toList();
        Map<UUID, List<Tentativa>> porEmpresa = ids.isEmpty() ? Map.of()
                : tentativas.dasEmpresas(ids).stream().collect(Collectors.groupingBy(Tentativa::getEmpresaId));
        return Pagina.de(pagEmpresas, e -> {
            List<Tentativa> daEmpresa = porEmpresa.getOrDefault(e.getId(), List.of());
            TentativaDto ultima = daEmpresa.isEmpty() ? null : TentativaDto.de(daEmpresa.get(0));
            return ItemProspeccao.de(e, daEmpresa.size(), ultima);
        });
    }

    @Transactional(readOnly = true)
    public Pagina<TentativaDto> tentativas(UUID empresaId, Pageable pagina) {
        empresas.buscar(empresaId);
        return Pagina.de(tentativas.daEmpresa(empresaId, pagina), TentativaDto::de);
    }

    @Transactional
    public TentativaDto registrar(UUID empresaId, NovaTentativa dados, UUID usuario) {
        empresas.buscar(empresaId);
        validarContato(empresaId, dados.contatoId());
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime realizadaEm = dados.realizadaEm() == null ? agora : dados.realizadaEm();
        if (realizadaEm.isAfter(agora.plusMinutes(5))) {
            throw new CampoInvalidoException("realizadaEm", "CAMPO_INVALIDO",
                    "A tentativa registra um contato já feito; para o futuro, crie uma tarefa.");
        }
        String observacao = dados.observacao() == null || dados.observacao().isBlank() ? null
                : dados.observacao().strip();
        return TentativaDto.de(tentativas.save(Tentativa.nova(empresaId, dados.contatoId(), dados.canal(),
                dados.resultado(), observacao, realizadaEm, usuario)));
    }

    @Transactional
    public OportunidadeDto converter(UUID empresaId, ConverterEmpresa d, Recorte recorte) {
        Empresa empresa = empresas.buscar(empresaId);
        if (!empresa.emProspeccao()) {
            throw new ConflitoException("EMPRESA_FORA_DA_PROSPECCAO",
                    "Só empresas em lead ou prospect são convertidas pela prospecção.",
                    "Para cliente ativo, crie uma oportunidade de upsell ou cross-sell.");
        }
        validarContato(empresaId, d.contatoId());
        OportunidadeDto criada = oportunidades.criar(new NovaOportunidade(d.titulo(), empresaId, d.contatoId(), null,
                null, "nova", d.produtoId(), d.valorImplantacao(), d.valorMrr(), d.probabilidade(),
                d.dataPrevistaFechamento(), d.proximoPasso(), d.dataProximoPasso(), d.responsavelId(), ORIGEM,
                empresaId.toString()), recorte);
        empresa.avancarParaProspect(recorte.usuarioId());
        return criada;
    }

    @Transactional
    public void excluir(UUID id) {
        tentativas.delete(tentativas.buscarPorId(id)
                .orElseThrow(() -> new NaoEncontradoException("Tentativa não encontrada.")));
    }

    private void validarContato(UUID empresaId, UUID contatoId) {
        if (contatoId == null) {
            return;
        }
        boolean daEmpresa = contatos.buscarPorId(contatoId).map(c -> empresaId.equals(c.getEmpresaId())).orElse(false);
        if (!daEmpresa) {
            throw new CampoInvalidoException("contatoId", "CONTATO_DE_OUTRA_EMPRESA",
                    "O contato precisa pertencer à empresa.");
        }
    }

    static List<String> statusDaLista(String status) {
        return status == null ? STATUS_EM_PROSPECCAO : List.of(status);
    }
}
