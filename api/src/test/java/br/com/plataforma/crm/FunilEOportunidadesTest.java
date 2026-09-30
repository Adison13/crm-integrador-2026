package br.com.plataforma.crm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

class FunilEOportunidadesTest extends BaseIntegracao {

    private static final String FUNIS = "/api/crm/funis";
    private static final String OPORTUNIDADES = "/api/crm/oportunidades";
    private static final String[] TUDO = {
            "crm.funil.ver", "crm.funil.administrar", "crm.empresa.criar", "crm.contato.criar",
            "crm.oportunidade.ver", "crm.oportunidade.criar", "crm.oportunidade.editar", "crm.oportunidade.excluir"};

    private final String amanha = LocalDate.now().plusDays(1).toString();

    @Test
    void primeiroAcessoCriaOFunilPadraoDaCentinela() throws Exception {
        UUID tenant = UUID.randomUUID();
        mvc.perform(get(FUNIS).with(pessoa(tenant, UUID.randomUUID(), List.of(), "crm.funil.ver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].padrao").value(true))
                .andExpect(jsonPath("$.data[0].etapas.length()").value(5))
                .andExpect(jsonPath("$.data[0].etapas[0].nome").value("Captação"))
                .andExpect(jsonPath("$.data[0].etapas[2].nome").value("Diagnóstico Gratuito"))
                .andExpect(jsonPath("$.data[0].etapas[4].ordem").value(5));

        mvc.perform(get(FUNIS).with(pessoa(tenant, UUID.randomUUID(), List.of(), "crm.funil.ver")))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void oportunidadeSemEtapaEntraNaPrimeiraEtapaDoPadraoEPublicaEvento() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID vendedor = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, vendedor);

        String corpo = mvc.perform(post(OPORTUNIDADES).with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oportunidade(empresa, "\"proximoPasso\":\"Ligar\",\"dataProximoPasso\":\"" + amanha + "\"")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("aberta"))
                .andExpect(jsonPath("$.data.tipo").value("nova"))
                .andExpect(jsonPath("$.data.responsavelId").value(vendedor.toString()))
                .andExpect(jsonPath("$.data.proximoPassoAtrasado").value(false))
                .andReturn().getResponse().getContentAsString();

        String etapaId = JsonPath.read(corpo, "$.data.etapaId");
        String primeira = primeiraEtapa(tenant);
        assertThat(etapaId).isEqualTo(primeira);
        verify(rabbit).convertAndSend(eq("crm.eventos"), eq("crm.oportunidade.criada"), any(Object.class));
    }

    @Test
    void usuarioPrecisaInformarOProximoPasso() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID vendedor = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, vendedor);

        mvc.perform(post(OPORTUNIDADES).with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oportunidade(empresa, "\"tipo\":\"upsell\"")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("proximoPasso"))
                .andExpect(jsonPath("$.errors[0].codigo").value("CAMPO_OBRIGATORIO"));
    }

    @Test
    void landingCriaLeadSemResponsavelComPrimeiroPassoPadrao() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, UUID.randomUUID());

        mvc.perform(post(OPORTUNIDADES)
                        .with(servico("landing", "crm.oportunidade.criar"))
                        .header("X-Tenant-Id", tenant.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oportunidade(empresa, "\"origem\":\"landing\",\"origemModuloId\":\"form-1\"")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.responsavelId").value(nullValue()))
                .andExpect(jsonPath("$.data.proximoPasso").value("Fazer o primeiro contato"))
                .andExpect(jsonPath("$.data.origem").value("landing"));
    }

    @Test
    void valorComMaisDeDuasCasasResponde400PrecisaoExcedida() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID vendedor = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, vendedor);

        mvc.perform(post(OPORTUNIDADES).with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oportunidade(empresa, passo() + ",\"valorMrr\":890.123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("valorMrr"))
                .andExpect(jsonPath("$.errors[0].codigo").value("PRECISAO_EXCEDIDA"));
    }

    @Test
    void contatoDeOutraEmpresaResponde400() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID vendedor = UUID.randomUUID();
        String empresaA = criarEmpresa(tenant, vendedor);
        String empresaB = criarEmpresa(tenant, vendedor);
        String contatoDeB = JsonPath.read(mvc.perform(post("/api/crm/contatos").with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"empresaId\":\"" + empresaB + "\",\"nome\":\"Bruna\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");

        mvc.perform(post(OPORTUNIDADES).with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oportunidade(empresaA, passo() + ",\"contatoId\":\"" + contatoDeB + "\"")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("contatoId"));
    }

    @Test
    void moverSoDentroDoMesmoFunil() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID admin = UUID.randomUUID();
        String id = criarOportunidade(tenant, admin);
        String funilPadrao = JsonPath.read(listarFunis(tenant), "$.data[0].id");
        String terceira = JsonPath.read(listarFunis(tenant), "$.data[0].etapas[2].id");

        mvc.perform(post(OPORTUNIDADES + "/" + id + "/mover").with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"etapaId\":\"" + terceira + "\",\"proximoPasso\":\"Apresentar diagnóstico\",\"dataProximoPasso\":\"" + amanha + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.etapaId").value(terceira))
                .andExpect(jsonPath("$.data.funilId").value(funilPadrao))
                .andExpect(jsonPath("$.data.proximoPasso").value("Apresentar diagnóstico"));

        String outroFunil = mvc.perform(post(FUNIS).with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Renovação\",\"etapas\":[{\"nome\":\"Aviso\"},{\"nome\":\"Renovado\"}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.padrao").value(false))
                .andReturn().getResponse().getContentAsString();
        String etapaDeOutroFunil = JsonPath.read(outroFunil, "$.data.etapas[0].id");

        mvc.perform(post(OPORTUNIDADES + "/" + id + "/mover").with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"etapaId\":\"" + etapaDeOutroFunil + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].codigo").value("ETAPA_DE_OUTRO_FUNIL"));
    }

    @Test
    void ganharFechaPublicaEventoEBloqueiaAlteracoes() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID vendedor = UUID.randomUUID();
        String id = criarOportunidade(tenant, vendedor);

        mvc.perform(post(OPORTUNIDADES + "/" + id + "/ganhar").with(pessoa(tenant, vendedor, List.of(), TUDO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ganha"))
                .andExpect(jsonPath("$.data.fechadaEm").isNotEmpty());
        verify(rabbit).convertAndSend(eq("crm.eventos"), eq("crm.oportunidade.ganha"), any(Object.class));

        mvc.perform(post(OPORTUNIDADES + "/" + id + "/perder").with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Preço\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("OPORTUNIDADE_FECHADA"));
    }

    @Test
    void perderExigeMotivo() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID vendedor = UUID.randomUUID();
        String id = criarOportunidade(tenant, vendedor);

        mvc.perform(post(OPORTUNIDADES + "/" + id + "/perder").with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("motivo"));

        mvc.perform(post(OPORTUNIDADES + "/" + id + "/perder").with(pessoa(tenant, vendedor, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Já possui fornecedor\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("perdida"))
                .andExpect(jsonPath("$.data.motivoPerda").value("Já possui fornecedor"));
        verify(rabbit, never()).convertAndSend(eq("crm.eventos"), eq("crm.oportunidade.ganha"), any(Object.class));
    }

    @Test
    void vendedorVeSoAsPropriasAsDaEquipeEAsSemResponsavel() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        UUID bruno = UUID.randomUUID();
        UUID equipe = UUID.randomUUID();
        String daAna = criarOportunidade(tenant, ana);

        mvc.perform(get(OPORTUNIDADES + "/" + daAna).with(pessoa(tenant, bruno, List.of(), TUDO)))
                .andExpect(status().isNotFound());
        mvc.perform(get(OPORTUNIDADES).with(pessoa(tenant, bruno, List.of(), TUDO)))
                .andExpect(jsonPath("$.data.total").value(0));
        mvc.perform(get(OPORTUNIDADES).with(pessoa(tenant, bruno, List.of(), "crm.oportunidade.ver", "crm.oportunidade.ver_todas")))
                .andExpect(jsonPath("$.data.total").value(1));

        String daEquipe = criarOportunidade(tenant, ana, List.of(equipe.toString()));
        mvc.perform(get(OPORTUNIDADES + "/" + daEquipe).with(pessoa(tenant, bruno, List.of(equipe.toString()), TUDO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.equipeId").value(equipe.toString()));

        String empresa = criarEmpresa(tenant, ana);
        mvc.perform(post(OPORTUNIDADES).with(servico("landing", "crm.oportunidade.criar"))
                        .header("X-Tenant-Id", tenant.toString())
                        .contentType(MediaType.APPLICATION_JSON).content(oportunidade(empresa, "")))
                .andExpect(status().isCreated());
        mvc.perform(get(OPORTUNIDADES).with(pessoa(tenant, bruno, List.of(), TUDO)))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void oportunidadeDeOutroTenantResponde404() throws Exception {
        UUID vendedor = UUID.randomUUID();
        String id = criarOportunidade(UUID.randomUUID(), vendedor);

        mvc.perform(get(OPORTUNIDADES + "/" + id).with(pessoa(UUID.randomUUID(), vendedor, List.of(),
                        "crm.oportunidade.ver", "crm.oportunidade.ver_todas")))
                .andExpect(status().isNotFound());
    }

    @Test
    void etapaComOportunidadesUltimaEtapaEFunilPadraoNaoSaoRemovidos() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID admin = UUID.randomUUID();
        criarOportunidade(tenant, admin);
        String funis = listarFunis(tenant);
        String padrao = JsonPath.read(funis, "$.data[0].id");
        String primeira = JsonPath.read(funis, "$.data[0].etapas[0].id");
        String segunda = JsonPath.read(funis, "$.data[0].etapas[1].id");

        mvc.perform(delete("/api/crm/etapas/" + primeira).with(pessoa(tenant, admin, List.of(), TUDO)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("ETAPA_COM_OPORTUNIDADES"));
        mvc.perform(delete("/api/crm/etapas/" + segunda).with(pessoa(tenant, admin, List.of(), TUDO)))
                .andExpect(status().isOk());
        mvc.perform(delete(FUNIS + "/" + padrao).with(pessoa(tenant, admin, List.of(), TUDO)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("FUNIL_PADRAO"));

        String unico = JsonPath.read(mvc.perform(post(FUNIS).with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Teste\",\"etapas\":[{\"nome\":\"Só uma\"}]}"))
                .andReturn().getResponse().getContentAsString(), "$.data.etapas[0].id");
        mvc.perform(delete("/api/crm/etapas/" + unico).with(pessoa(tenant, admin, List.of(), TUDO)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("ULTIMA_ETAPA"));

        mvc.perform(get(FUNIS + "/" + padrao).with(pessoa(tenant, admin, List.of(), TUDO)))
                .andExpect(jsonPath("$.data.etapas.length()").value(4))
                .andExpect(jsonPath("$.data.etapas[1].ordem").value(2));
    }

    @Test
    void reordenarExigeTodasAsEtapasETornarPadraoTrocaOAnterior() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID admin = UUID.randomUUID();
        String funis = listarFunis(tenant);
        String padrao = JsonPath.read(funis, "$.data[0].id");
        List<String> ids = JsonPath.read(funis, "$.data[0].etapas[*].id");

        mvc.perform(put(FUNIS + "/" + padrao + "/etapas/ordem").with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"etapaIds\":[\"" + ids.get(0) + "\"]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("etapaIds"));

        List<String> invertida = new ArrayList<>(ids);
        Collections.reverse(invertida);
        mvc.perform(put(FUNIS + "/" + padrao + "/etapas/ordem").with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"etapaIds\":[\"" + String.join("\",\"", invertida) + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.etapas[0].nome").value("Negociação"));

        String novo = JsonPath.read(mvc.perform(post(FUNIS).with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Renovação\",\"etapas\":[{\"nome\":\"Aviso\",\"cor\":\"#0E9F8E\"}]}"))
                .andReturn().getResponse().getContentAsString(), "$.data.id");
        mvc.perform(put(FUNIS + "/" + novo).with(pessoa(tenant, admin, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Renovação\",\"padrao\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.padrao").value(true));
        mvc.perform(get(FUNIS + "/" + padrao).with(pessoa(tenant, admin, List.of(), TUDO)))
                .andExpect(jsonPath("$.data.padrao").value(false));
    }

    private String criarEmpresa(UUID tenant, UUID usuario) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/crm/empresas").with(pessoa(tenant, usuario, List.of(), TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"razaoSocial\":\"Cliente " + UUID.randomUUID() + "\",\"origem\":\"manual\",\"origemModuloId\":\"crm\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
    }

    private String criarOportunidade(UUID tenant, UUID usuario) throws Exception {
        return criarOportunidade(tenant, usuario, List.of());
    }

    private String criarOportunidade(UUID tenant, UUID usuario, List<String> equipes) throws Exception {
        String empresa = criarEmpresa(tenant, usuario);
        return JsonPath.read(mvc.perform(post(OPORTUNIDADES).with(pessoa(tenant, usuario, equipes, TUDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oportunidade(empresa, passo())))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
    }

    private String listarFunis(UUID tenant) throws Exception {
        return mvc.perform(get(FUNIS).with(pessoa(tenant, UUID.randomUUID(), List.of(), "crm.funil.ver")))
                .andReturn().getResponse().getContentAsString();
    }

    private String primeiraEtapa(UUID tenant) throws Exception {
        return JsonPath.read(listarFunis(tenant), "$.data[0].etapas[0].id");
    }

    private String passo() {
        return "\"proximoPasso\":\"Ligar para o sócio\",\"dataProximoPasso\":\"" + amanha + "\"";
    }

    private static String oportunidade(String empresa, String extra) {
        return "{\"titulo\":\"Backup gerenciado\",\"empresaId\":\"" + empresa + "\""
                + (extra.isEmpty() ? "" : "," + extra) + "}";
    }

    private static RequestPostProcessor pessoa(UUID tenant, UUID sub, List<String> equipes, String... permissoes) {
        return jwt()
                .jwt(token -> token
                        .subject(sub.toString())
                        .claim("tenant_id", tenant.toString())
                        .claim("equipes", equipes)
                        .claim("perms", List.of(permissoes)))
                .authorities(Arrays.stream(permissoes).map(SimpleGrantedAuthority::new).toArray(GrantedAuthority[]::new));
    }
}
