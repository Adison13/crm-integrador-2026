package br.com.plataforma.crm.oportunidade;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.ConflitoException;
import br.com.plataforma.crm.api.NaoEncontradoException;
import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.contato.ContatoRepositorio;
import br.com.plataforma.crm.empresa.EmpresaRepositorio;
import br.com.plataforma.crm.empresa.UnidadeRepositorio;
import br.com.plataforma.crm.eventos.FatoOcorrido;
import br.com.plataforma.crm.funil.Etapa;
import br.com.plataforma.crm.funil.EtapaRepositorio;
import br.com.plataforma.crm.funil.FunilServico;
import br.com.plataforma.crm.tenant.TenantContexto;

@Service
public class OportunidadeServico {

    static final String PRIMEIRO_PASSO = "Fazer o primeiro contato";
    static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private final OportunidadeRepositorio oportunidades;
    private final EtapaRepositorio etapas;
    private final FunilServico funis;
    private final EmpresaRepositorio empresas;
    private final ContatoRepositorio contatos;
    private final UnidadeRepositorio unidades;
    private final ApplicationEventPublisher eventos;

    public OportunidadeServico(OportunidadeRepositorio oportunidades, EtapaRepositorio etapas, FunilServico funis,
                               EmpresaRepositorio empresas, ContatoRepositorio contatos, UnidadeRepositorio unidades,
                               ApplicationEventPublisher eventos) {
        this.oportunidades = oportunidades;
        this.etapas = etapas;
        this.funis = funis;
        this.empresas = empresas;
        this.contatos = contatos;
        this.unidades = unidades;
        this.eventos = eventos;
    }

    @Transactional(readOnly = true)
    public Pagina<OportunidadeDto> listar(Filtros filtros, Recorte recorte, Pageable pagina) {
        Page<Oportunidade> resultado = oportunidades.findAll(Consultas.de(filtros, recorte), pagina);
        Map<UUID, UUID> funilDaEtapa = etapas.buscarPorIds(resultado.getContent().stream()
                        .map(Oportunidade::getEtapaId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(Etapa::getId, Etapa::getFunilId));
        LocalDate hoje = hoje();
        return Pagina.de(resultado, o -> OportunidadeDto.de(o, funilDaEtapa.get(o.getEtapaId()), hoje));
    }

    @Transactional(readOnly = true)
    public OportunidadeDto ver(UUID id, Recorte recorte) {
        return dto(buscar(id, recorte));
    }

    @Transactional
    public OportunidadeDto criar(NovaOportunidade d, Recorte recorte) {
        UUID usuario = recorte.usuarioId();
        Etapa etapa = d.etapaId() == null ? funis.etapaInicialPadrao(usuario) : etapaExistente(d.etapaId());

        String proximoPasso = d.proximoPasso();
        LocalDate dataProximoPasso = d.dataProximoPasso();
        if (usuario == null && proximoPasso == null && dataProximoPasso == null) {
            proximoPasso = PRIMEIRO_PASSO;
            dataProximoPasso = hoje();
        }
        UUID responsavel = d.responsavelId() != null ? d.responsavelId() : usuario;

        DadosComerciais dados = new DadosComerciais(d.titulo().strip(), d.empresaId(), d.contatoId(), d.unidadeId(),
                d.tipo() == null ? "nova" : d.tipo(), d.produtoId(), d.valorImplantacao(), d.valorMrr(),
                d.probabilidade(), d.dataPrevistaFechamento(), texto(proximoPasso), dataProximoPasso, responsavel);
        validar(dados);

        Oportunidade o = oportunidades.save(Oportunidade.nova(dados, etapa.getId(), recorte.equipePara(responsavel),
                d.origem(), d.origemModuloId(), usuario));
        publicar("crm.oportunidade.criada", usuario, dadosCriada(o, etapa.getFunilId()));
        return OportunidadeDto.de(o, etapa.getFunilId(), hoje());
    }

    @Transactional
    public OportunidadeDto editar(UUID id, EditarOportunidade d, Recorte recorte) {
        Oportunidade o = buscarAberta(id, recorte);
        DadosComerciais dados = new DadosComerciais(d.titulo().strip(), d.empresaId(), d.contatoId(), d.unidadeId(),
                d.tipo() == null ? "nova" : d.tipo(), d.produtoId(), d.valorImplantacao(), d.valorMrr(),
                d.probabilidade(), d.dataPrevistaFechamento(), d.proximoPasso().strip(), d.dataProximoPasso(),
                d.responsavelId() != null ? d.responsavelId() : o.getResponsavelId());
        validar(dados);
        o.editar(dados, recorte.usuarioId());
        return dto(o);
    }

    @Transactional
    public OportunidadeDto mover(UUID id, MoverOportunidade d, Recorte recorte) {
        Oportunidade o = buscarAberta(id, recorte);
        Etapa atual = etapaExistente(o.getEtapaId());
        Etapa destino = etapaExistente(d.etapaId());
        if (!destino.getFunilId().equals(atual.getFunilId())) {
            throw new CampoInvalidoException("etapaId", "ETAPA_DE_OUTRO_FUNIL",
                    "A etapa de destino precisa ser do mesmo funil.");
        }
        if ((d.proximoPasso() == null) != (d.dataProximoPasso() == null)) {
            throw new CampoInvalidoException(d.proximoPasso() == null ? "proximoPasso" : "dataProximoPasso",
                    "CAMPO_OBRIGATORIO", "Informe o próximo passo junto com a data.");
        }
        o.mover(destino.getId(), texto(d.proximoPasso()), d.dataProximoPasso(), recorte.usuarioId());
        return OportunidadeDto.de(o, destino.getFunilId(), hoje());
    }

    @Transactional
    public OportunidadeDto ganhar(UUID id, Recorte recorte) {
        Oportunidade o = buscarAberta(id, recorte);
        o.ganhar(recorte.usuarioId());
        publicar("crm.oportunidade.ganha", recorte.usuarioId(), dadosGanha(o));
        return dto(o);
    }

    @Transactional
    public OportunidadeDto perder(UUID id, PerderOportunidade d, Recorte recorte) {
        Oportunidade o = buscarAberta(id, recorte);
        o.perder(d.motivo().strip(), recorte.usuarioId());
        return dto(o);
    }

    @Transactional
    public void excluir(UUID id, Recorte recorte) {
        oportunidades.delete(buscar(id, recorte));
    }

    private Oportunidade buscar(UUID id, Recorte recorte) {
        return oportunidades.buscarPorId(id).filter(recorte::enxerga)
                .orElseThrow(() -> new NaoEncontradoException("Oportunidade não encontrada."));
    }

    private Oportunidade buscarAberta(UUID id, Recorte recorte) {
        Oportunidade o = buscar(id, recorte);
        if (!o.estaAberta()) {
            throw new ConflitoException("OPORTUNIDADE_FECHADA", "Esta oportunidade já foi fechada.",
                    "Oportunidade ganha ou perdida não pode ser alterada.");
        }
        return o;
    }

    private Etapa etapaExistente(UUID id) {
        return etapas.buscarPorId(id).orElseThrow(() ->
                new CampoInvalidoException("etapaId", "ETAPA_INEXISTENTE", "Etapa não encontrada."));
    }

    private void validar(DadosComerciais d) {
        if (d.proximoPasso() == null || d.dataProximoPasso() == null) {
            throw new CampoInvalidoException(d.proximoPasso() == null ? "proximoPasso" : "dataProximoPasso",
                    "CAMPO_OBRIGATORIO", "Oportunidade aberta precisa de próximo passo e data (RF-CRM-03).");
        }
        if (empresas.buscarPorId(d.empresaId()).isEmpty()) {
            throw new CampoInvalidoException("empresaId", "EMPRESA_INEXISTENTE", "Empresa não encontrada.");
        }
        if (d.contatoId() != null) {
            contatos.buscarPorId(d.contatoId())
                    .filter(c -> c.getEmpresaId().equals(d.empresaId()))
                    .orElseThrow(() -> new CampoInvalidoException("contatoId", "CONTATO_INVALIDO",
                            "Contato não encontrado nesta empresa."));
        }
        if (d.unidadeId() != null) {
            unidades.buscarPorId(d.unidadeId())
                    .filter(u -> u.getEmpresaId().equals(d.empresaId()))
                    .orElseThrow(() -> new CampoInvalidoException("unidadeId", "UNIDADE_INVALIDA",
                            "Unidade não encontrada nesta empresa."));
        }
    }

    private OportunidadeDto dto(Oportunidade o) {
        return OportunidadeDto.de(o, etapaExistente(o.getEtapaId()).getFunilId(), hoje());
    }

    private void publicar(String tipo, UUID usuario, Map<String, Object> dados) {
        eventos.publishEvent(new FatoOcorrido(tipo, TenantContexto.exigir(), usuario, dados));
    }

    private static Map<String, Object> dadosCriada(Oportunidade o, UUID funilId) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("oportunidadeId", o.getId());
        dados.put("titulo", o.getTitulo());
        dados.put("empresaId", o.getEmpresaId());
        dados.put("contatoId", o.getContatoId());
        dados.put("funilId", funilId);
        dados.put("etapaId", o.getEtapaId());
        dados.put("tipo", o.getTipo());
        dados.put("responsavelId", o.getResponsavelId());
        dados.put("valorImplantacao", o.getValorImplantacao());
        dados.put("valorMrr", o.getValorMrr());
        dados.put("origem", o.getOrigem());
        dados.put("origemModuloId", o.getOrigemModuloId());
        return dados;
    }

    private static Map<String, Object> dadosGanha(Oportunidade o) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("oportunidadeId", o.getId());
        dados.put("titulo", o.getTitulo());
        dados.put("empresaId", o.getEmpresaId());
        dados.put("contatoId", o.getContatoId());
        dados.put("unidadeId", o.getUnidadeId());
        dados.put("produtoId", o.getProdutoId());
        dados.put("tipo", o.getTipo());
        dados.put("valorImplantacao", o.getValorImplantacao());
        dados.put("valorMrr", o.getValorMrr());
        dados.put("responsavelId", o.getResponsavelId());
        dados.put("fechadaEm", o.getFechadaEm());
        return dados;
    }

    private static String texto(String valor) {
        return valor == null || valor.isBlank() ? null : valor.strip();
    }

    private static LocalDate hoje() {
        return LocalDate.now(FUSO);
    }
}
