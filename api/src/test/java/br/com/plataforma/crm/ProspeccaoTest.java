package br.com.plataforma.crm;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

class ProspeccaoTest extends BaseIntegracao {

    private static final String[] PRE_VENDAS = {
            "crm.empresa.criar", "crm.empresa.ver", "crm.empresa.editar", "crm.contato.criar",
            "crm.prospeccao.ver", "crm.prospeccao.registrar", "crm.oportunidade.ver", "crm.oportunidade.criar"};
    private static final String[] SO_CONSULTA = {"crm.prospeccao.ver"};

    private final UUID usuario = UUID.randomUUID();
    private final String amanha = LocalDate.now().plusDays(1).toString();

    @Test
    void listaSoEmpresasEmLeadOuProspectComFiltros() throws Exception {
        UUID tenant = UUID.randomUUID();
        criarEmpresa(tenant, "Clinica Vida", "Saude", "Goiania");
        criarEmpresa(tenant, "Colegio Saber", "Educacao", "Anapolis");
        String cliente = criarEmpresa(tenant, "Contabil Exata", "Saude", "Goiania");
        mudarStatus(tenant, cliente, "Contabil Exata", "Saude", "cliente_ativo");

        mvc.perform(get("/api/crm/prospeccao").with(eu(tenant, PRE_VENDAS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.itens[0].razaoSocial").value("Clinica Vida"))
                .andExpect(jsonPath("$.data.itens[0].totalTentativas").value(0));
        mvc.perform(get("/api/crm/prospeccao").param("segmento", "saude").param("cidade", "GOIANIA")
                        .with(eu(tenant, PRE_VENDAS)))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.itens[0].razaoSocial").value("Clinica Vida"));
        mvc.perform(get("/api/crm/prospeccao").param("status", "cliente_ativo").with(eu(tenant, PRE_VENDAS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("status"));
        mvc.perform(get("/api/crm/prospeccao").with(eu(tenant, "crm.oportunidade.ver")))
                .andExpect(status().isForbidden());
    }

    @Test
    void tentativasAparecemNaListaENoHistoricoMaisRecentePrimeiro() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Moura e Lima", "Juridico", "Goiania");
        registrar(tenant, empresa, "{\"canal\":\"telefone\",\"resultado\":\"sem_resposta\",\"realizadaEm\":\""
                + OffsetDateTime.now(ZoneOffset.UTC).minusDays(1) + "\"}");
        String ultima = registrar(tenant, empresa,
                "{\"canal\":\"whatsapp\",\"resultado\":\"contato_realizado\",\"observacao\":\"  Pediu proposta  \"}");

        mvc.perform(get("/api/crm/prospeccao").with(eu(tenant, SO_CONSULTA)))
                .andExpect(jsonPath("$.data.itens[0].totalTentativas").value(2))
                .andExpect(jsonPath("$.data.itens[0].ultimaTentativa.id").value(ultima))
                .andExpect(jsonPath("$.data.itens[0].ultimaTentativa.observacao").value("Pediu proposta"));
        mvc.perform(get("/api/crm/empresas/" + empresa + "/tentativas").with(eu(tenant, SO_CONSULTA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.itens[0].canal").value("whatsapp"))
                .andExpect(jsonPath("$.data.itens[1].resultado").value("sem_resposta"));

        mvc.perform(delete("/api/crm/tentativas/" + ultima).with(eu(tenant, PRE_VENDAS)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/crm/empresas/" + empresa + "/tentativas").with(eu(tenant, SO_CONSULTA)))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void tentativaInvalidaSemPermissaoOuDeOutroTenantERecusada() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Bom Preco", "Varejo", "Anapolis");
        String outra = criarEmpresa(tenant, "Saber Mais", "Educacao", "Goiania");
        String contatoDaOutra = criarContato(tenant, outra);

        postarTentativa(tenant, empresa, "{\"canal\":\"telefone\",\"resultado\":\"sem_resposta\",\"realizadaEm\":\""
                + OffsetDateTime.now(ZoneOffset.UTC).plusDays(2) + "\"}", PRE_VENDAS)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("realizadaEm"));
        postarTentativa(tenant, empresa, "{\"canal\":\"pombo\",\"resultado\":\"sem_resposta\"}", PRE_VENDAS)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("canal"));
        postarTentativa(tenant, empresa, "{\"canal\":\"telefone\",\"resultado\":\"sem_resposta\",\"contatoId\":\""
                + contatoDaOutra + "\"}", PRE_VENDAS)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("contatoId"));
        postarTentativa(tenant, empresa, "{\"canal\":\"telefone\",\"resultado\":\"sem_resposta\"}", SO_CONSULTA)
                .andExpect(status().isForbidden());
        postarTentativa(UUID.randomUUID(), empresa, "{\"canal\":\"telefone\",\"resultado\":\"sem_resposta\"}",
                PRE_VENDAS)
                .andExpect(status().isNotFound());
    }

    @Test
    void converterCriaOportunidadeEPassaLeadParaProspect() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Cerrado Log", "Logistica", "Senador Canedo");

        String oportunidade = JsonPath.read(mvc.perform(post("/api/crm/empresas/" + empresa + "/converter")
                        .with(eu(tenant, PRE_VENDAS)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Backup em nuvem\",\"valorMrr\":480.00,\"proximoPasso\":\"Agendar diagnostico\","
                                + "\"dataProximoPasso\":\"" + amanha + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/crm/oportunidades/")))
                .andExpect(jsonPath("$.data.empresaId").value(empresa))
                .andExpect(jsonPath("$.data.origem").value("prospeccao"))
                .andExpect(jsonPath("$.data.responsavelId").value(usuario.toString()))
                .andReturn().getResponse().getContentAsString(), "$.data.id");

        mvc.perform(get("/api/crm/oportunidades/" + oportunidade).with(eu(tenant, PRE_VENDAS)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/crm/empresas/" + empresa).with(eu(tenant, PRE_VENDAS)))
                .andExpect(jsonPath("$.data.statusComercial").value("prospect"));

        mudarStatus(tenant, empresa, "Cerrado Log", "Logistica", "cliente_ativo");
        mvc.perform(post("/api/crm/empresas/" + empresa + "/converter").with(eu(tenant, PRE_VENDAS))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Antivirus\",\"proximoPasso\":\"Ligar\",\"dataProximoPasso\":\"" + amanha + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("EMPRESA_FORA_DA_PROSPECCAO"));
    }

    @Test
    void listagemDeEmpresasFiltraPorSegmentoEStatus() throws Exception {
        UUID tenant = UUID.randomUUID();
        criarEmpresa(tenant, "Clinica Vida", "Saude", "Goiania");
        String cliente = criarEmpresa(tenant, "Clinica Sorriso", "Saude", "Goiania");
        criarEmpresa(tenant, "Colegio Saber", "Educacao", "Goiania");
        mudarStatus(tenant, cliente, "Clinica Sorriso", "Saude", "cliente_ativo");

        mvc.perform(get("/api/crm/empresas").param("segmento", "Saude").with(eu(tenant, PRE_VENDAS)))
                .andExpect(jsonPath("$.data.total").value(2));
        mvc.perform(get("/api/crm/empresas").param("segmento", "Saude").param("status", "cliente_ativo")
                        .with(eu(tenant, PRE_VENDAS)))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.itens[0].id").value(cliente));
        mvc.perform(get("/api/crm/empresas").param("status", "ativo").with(eu(tenant, PRE_VENDAS)))
                .andExpect(status().isBadRequest());
    }

    private RequestPostProcessor eu(UUID tenant, String... permissoes) {
        return pessoa(tenant, usuario, List.of(), permissoes);
    }

    private String criarEmpresa(UUID tenant, String razaoSocial, String segmento, String cidade) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/crm/empresas").with(eu(tenant, PRE_VENDAS))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"razaoSocial\":\"" + razaoSocial + "\",\"segmento\":\"" + segmento
                                + "\",\"cidade\":\"" + cidade + "\",\"origem\":\"crm\",\"origemModuloId\":\"teste\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
    }

    private void mudarStatus(UUID tenant, String empresa, String razaoSocial, String segmento, String status)
            throws Exception {
        mvc.perform(put("/api/crm/empresas/" + empresa).with(eu(tenant, PRE_VENDAS))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"razaoSocial\":\"" + razaoSocial + "\",\"segmento\":\"" + segmento
                                + "\",\"cidade\":\"Goiania\",\"statusComercial\":\"" + status + "\"}"))
                .andExpect(status().isOk());
    }

    private String criarContato(UUID tenant, String empresa) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/crm/contatos").with(eu(tenant, PRE_VENDAS))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"empresaId\":\"" + empresa + "\",\"nome\":\"Contato\",\"email\":\""
                                + UUID.randomUUID() + "@exemplo.com\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
    }

    private ResultActions postarTentativa(UUID tenant, String empresa, String corpo, String... permissoes) throws Exception {
        return mvc.perform(post("/api/crm/empresas/" + empresa + "/tentativas").with(eu(tenant, permissoes))
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private String registrar(UUID tenant, String empresa, String corpo) throws Exception {
        return JsonPath.read(postarTentativa(tenant, empresa, corpo, PRE_VENDAS)
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/crm/tentativas/")))
                .andReturn().getResponse().getContentAsString(), "$.data.id");
    }
}
