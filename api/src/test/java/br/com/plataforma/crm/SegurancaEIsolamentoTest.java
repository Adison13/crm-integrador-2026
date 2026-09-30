package br.com.plataforma.crm;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.jayway.jsonpath.JsonPath;

/** Os itens do checklist de conformidade que dependem só deste módulo (Contrato §15). */
class SegurancaEIsolamentoTest extends BaseIntegracao {

    private static final String EMPRESAS = "/api/crm/empresas";
    private static final String VER = "crm.empresa.ver";
    private static final String VER_RESUMO = "crm.empresa.ver_resumo";
    private static final String CRIAR = "crm.empresa.criar";
    private static final String EDITAR = "crm.empresa.editar";

    @Test
    void saudeRespondeSemToken() throws Exception {
        mvc.perform(get("/api/crm/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    void semTokenResponde401NoEnvelope() throws Exception {
        mvc.perform(get(EMPRESAS))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Autenticação necessária."));
    }

    @Test
    void semPermissaoResponde403() throws Exception {
        mvc.perform(get(EMPRESAS).with(usuario(UUID.randomUUID(), "crm.acessar")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void resumoNaoDaAcessoAoCadastroCompleto() throws Exception {
        UUID tenant = UUID.randomUUID();
        String id = criarEmpresa(tenant, "Resumo Ltda", null);

        mvc.perform(get(EMPRESAS + "/" + id + "/resumo").with(usuario(tenant, VER_RESUMO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.razaoSocial").value("Resumo Ltda"));
        mvc.perform(get(EMPRESAS + "/" + id).with(usuario(tenant, VER_RESUMO)))
                .andExpect(status().isForbidden());
    }

    @Test
    void registroDeOutroTenantResponde404() throws Exception {
        UUID empresaA = UUID.randomUUID();
        UUID empresaB = UUID.randomUUID();
        String id = criarEmpresa(empresaA, "Empresa do tenant A", null);

        mvc.perform(get(EMPRESAS + "/" + id).with(usuario(empresaB, VER)))
                .andExpect(status().isNotFound());
        mvc.perform(get(EMPRESAS).with(usuario(empresaB, VER)))
                .andExpect(jsonPath("$.data.total").value(0));

        mvc.perform(get(EMPRESAS + "/" + id).with(usuario(empresaA, VER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.razaoSocial").value("Empresa do tenant A"))
                .andExpect(jsonPath("$.data.statusComercial").value("lead"));
    }

    @Test
    void tenantEnviadoNoCorpoEIgnorado() throws Exception {
        UUID empresaDoToken = UUID.randomUUID();
        UUID empresaDoCorpo = UUID.randomUUID();

        mvc.perform(post(EMPRESAS)
                        .with(usuario(empresaDoToken, CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("Tentativa", null, ",\"tenantId\":\"" + empresaDoCorpo + "\"")))
                .andExpect(status().isCreated());

        mvc.perform(get(EMPRESAS).with(usuario(empresaDoCorpo, VER)))
                .andExpect(jsonPath("$.data.total").value(0));
        mvc.perform(get(EMPRESAS).with(usuario(empresaDoToken, VER)))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void tokenDeServicoSemCabecalhoDeTenantResponde400() throws Exception {
        mvc.perform(get(EMPRESAS).with(servico("financeiro", VER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void tokenDeServicoUsaOTenantDoCabecalho() throws Exception {
        UUID empresa = UUID.randomUUID();
        mvc.perform(post(EMPRESAS)
                        .with(servico("landing", CRIAR))
                        .header("X-Tenant-Id", empresa.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("Criada pela landing", null, "")))
                .andExpect(status().isCreated());

        mvc.perform(get(EMPRESAS).with(usuario(empresa, VER)))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void dadoInvalidoResponde400ComOCampo() throws Exception {
        mvc.perform(post(EMPRESAS)
                        .with(usuario(UUID.randomUUID(), CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("  ", null, "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("razaoSocial"));
    }

    @Test
    void cnpjDuplicadoNoMesmoTenantResponde409ComOIdExistente() throws Exception {
        UUID tenant = UUID.randomUUID();
        String original = criarEmpresa(tenant, "Original", "11222333000181");

        mvc.perform(post(EMPRESAS)
                        .with(usuario(tenant, CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("Copia", "11222333000181", "")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.empresaId").value(original))
                .andExpect(jsonPath("$.errors[0].campo").value("cnpj"))
                .andExpect(jsonPath("$.errors[0].codigo").value("EMPRESA_DUPLICADA"));
    }

    @Test
    void mesmoCnpjEmOutroTenantEPermitido() throws Exception {
        criarEmpresa(UUID.randomUUID(), "Tenant A", "44555666000199");
        criarEmpresa(UUID.randomUUID(), "Tenant B", "44555666000199");
    }

    @Test
    void editarParaCnpjDeOutraEmpresaResponde409() throws Exception {
        UUID tenant = UUID.randomUUID();
        criarEmpresa(tenant, "Primeira", "77888999000155");
        String id = criarEmpresa(tenant, "Segunda", "77888999000166");

        mvc.perform(put(EMPRESAS + "/" + id)
                        .with(usuario(tenant, EDITAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"razaoSocial\":\"Segunda\",\"cnpj\":\"77888999000155\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void buscaGlobalRespeitaTenantEFormato() throws Exception {
        UUID tenant = UUID.randomUUID();
        String id = criarEmpresa(tenant, "Centinela Soluções Digitais", "12345678000190");
        criarEmpresa(UUID.randomUUID(), "Centinela de Outro Tenant", null);

        mvc.perform(get("/api/crm/busca").param("q", "centinela").with(usuario(tenant, VER_RESUMO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(id))
                .andExpect(jsonPath("$.data[0].titulo").value("Centinela Soluções Digitais"))
                .andExpect(jsonPath("$.data[0].subtitulo").value("12.345.678/0001-90"))
                .andExpect(jsonPath("$.data[0].rota").value("/crm/empresas/" + id));

        mvc.perform(get("/api/crm/busca").param("q", "c").with(usuario(tenant, VER_RESUMO)))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    private String criarEmpresa(UUID tenant, String razaoSocial, String cnpj) throws Exception {
        String resposta = mvc.perform(post(EMPRESAS)
                        .with(usuario(tenant, CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(razaoSocial, cnpj, "")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith(EMPRESAS + "/")))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.data.id");
    }

    private static String corpo(String razaoSocial, String cnpj, String extra) {
        String campoCnpj = cnpj == null ? "" : ",\"cnpj\":\"" + cnpj + "\"";
        return "{\"razaoSocial\":\"" + razaoSocial + "\"" + campoCnpj
                + ",\"origem\":\"manual\",\"origemModuloId\":\"crm\"" + extra + "}";
    }
}
