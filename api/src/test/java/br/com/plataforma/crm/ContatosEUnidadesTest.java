package br.com.plataforma.crm;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import com.jayway.jsonpath.JsonPath;

class ContatosEUnidadesTest extends BaseIntegracao {

    private static final String CONTATOS = "/api/crm/contatos";
    private static final String EMPRESA_CRIAR = "crm.empresa.criar";
    private static final String EMPRESA_VER = "crm.empresa.ver";
    private static final String EMPRESA_VER_RESUMO = "crm.empresa.ver_resumo";
    private static final String VER = "crm.contato.ver";
    private static final String VER_RESUMO = "crm.contato.ver_resumo";
    private static final String CRIAR = "crm.contato.criar";
    private static final String EDITAR = "crm.contato.editar";

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void criaContatoEListaNaEmpresa() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Empresa com contatos");
        String contato = criarContato(tenant, empresa, "Ana Souza", "Ana@Exemplo.com");

        mvc.perform(get(CONTATOS + "/" + contato).with(usuario(tenant, VER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("ana@exemplo.com"))
                .andExpect(jsonPath("$.data.empresaId").value(empresa));

        mvc.perform(get("/api/crm/empresas/" + empresa + "/contatos").with(usuario(tenant, VER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.itens[0].nome").value("Ana Souza"));
    }

    @Test
    void emailRepetidoNaMesmaEmpresaResponde409ComOIdExistente() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Empresa A");
        String existente = criarContato(tenant, empresa, "Primeiro", "repetido@exemplo.com");

        mvc.perform(post(CONTATOS)
                        .with(usuario(tenant, CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoContato(empresa, "Segundo", "REPETIDO@Exemplo.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.data.contatoId").value(existente))
                .andExpect(jsonPath("$.errors[0].codigo").value("CONTATO_DUPLICADO"));
    }

    @Test
    void mesmoEmailEmOutraEmpresaEPermitido() throws Exception {
        UUID tenant = UUID.randomUUID();
        criarContato(tenant, criarEmpresa(tenant, "Empresa 1"), "Carlos", "carlos@exemplo.com");
        criarContato(tenant, criarEmpresa(tenant, "Empresa 2"), "Carlos", "carlos@exemplo.com");
    }

    @Test
    void editarParaEmailDeOutroContatoResponde409() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Empresa B");
        criarContato(tenant, empresa, "Bruno", "bruno@exemplo.com");
        String outro = criarContato(tenant, empresa, "Bia", "bia@exemplo.com");

        mvc.perform(put(CONTATOS + "/" + outro)
                        .with(usuario(tenant, EDITAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoContato(empresa, "Bia", "bruno@exemplo.com")))
                .andExpect(status().isConflict());

        mvc.perform(put(CONTATOS + "/" + outro)
                        .with(usuario(tenant, EDITAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoContato(empresa, "Beatriz", "bia@exemplo.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nome").value("Beatriz"));
    }

    @Test
    void empresaDeOutroTenantNaoAceitaContato() throws Exception {
        String empresaDeOutro = criarEmpresa(UUID.randomUUID(), "Empresa de outro tenant");

        mvc.perform(post(CONTATOS)
                        .with(usuario(UUID.randomUUID(), CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoContato(empresaDeOutro, "Intruso", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("empresaId"));
    }

    @Test
    void contatoDeOutroTenantResponde404() throws Exception {
        UUID tenant = UUID.randomUUID();
        String contato = criarContato(tenant, criarEmpresa(tenant, "Empresa C"), "Clara", null);

        mvc.perform(get(CONTATOS + "/" + contato).with(usuario(UUID.randomUUID(), VER)))
                .andExpect(status().isNotFound());
        mvc.perform(get(CONTATOS + "/" + contato + "/resumo").with(usuario(UUID.randomUUID(), VER_RESUMO)))
                .andExpect(status().isNotFound());
    }

    @Test
    void resumoNaoDaAcessoAoCadastroCompleto() throws Exception {
        UUID tenant = UUID.randomUUID();
        String contato = criarContato(tenant, criarEmpresa(tenant, "Empresa D"), "Diego", "diego@exemplo.com");

        mvc.perform(get(CONTATOS + "/" + contato + "/resumo").with(usuario(tenant, VER_RESUMO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nome").value("Diego"))
                .andExpect(jsonPath("$.data.papel").doesNotExist());
        mvc.perform(get(CONTATOS + "/" + contato).with(usuario(tenant, VER_RESUMO)))
                .andExpect(status().isForbidden());
    }

    @Test
    void valorForaDaListaResponde400() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Empresa E");

        mvc.perform(post(CONTATOS)
                        .with(usuario(tenant, CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"empresaId\":\"" + empresa + "\",\"nome\":\"Eva\",\"papel\":\"chefe\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("papel"));
    }

    @Test
    void resumoEmLoteAceitaNoMaximo100Ids() throws Exception {
        String ids = IntStream.range(0, 101).mapToObj(i -> UUID.randomUUID().toString())
                .collect(Collectors.joining(","));

        mvc.perform(get(CONTATOS + "/resumo").param("ids", ids).with(usuario(UUID.randomUUID(), VER_RESUMO)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/crm/empresas/resumo").param("ids", ids).with(usuario(UUID.randomUUID(), EMPRESA_VER_RESUMO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void buscaGlobalIncluiContatosSoComAPermissao() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Empresa Zeta");
        String contato = criarContato(tenant, empresa, "Fernanda Zeta", "fernanda@exemplo.com");

        mvc.perform(get("/api/crm/busca").param("q", "zeta").with(usuario(tenant, EMPRESA_VER_RESUMO, VER_RESUMO)))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[1].id").value(contato))
                .andExpect(jsonPath("$.data[1].rota").value("/contatos/" + contato));

        mvc.perform(get("/api/crm/busca").param("q", "zeta").with(usuario(tenant, EMPRESA_VER_RESUMO)))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(empresa));
    }

    @Test
    void unidadesDaEmpresaComMatrizPrimeiro() throws Exception {
        UUID tenant = UUID.randomUUID();
        String empresa = criarEmpresa(tenant, "Empresa com filiais");
        inserirUnidade(tenant, empresa, "filial", "Rua 2, Anápolis");
        inserirUnidade(tenant, empresa, "matriz", "Av. 1, Goiânia");

        mvc.perform(get("/api/crm/empresas/" + empresa + "/unidades").with(usuario(tenant, EMPRESA_VER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].tipo").value("matriz"))
                .andExpect(jsonPath("$.data[1].endereco").value("Rua 2, Anápolis"));

        mvc.perform(get("/api/crm/empresas/" + empresa + "/unidades").with(usuario(UUID.randomUUID(), EMPRESA_VER)))
                .andExpect(status().isNotFound());
    }

    private void inserirUnidade(UUID tenant, String empresa, String tipo, String endereco) {
        jdbc.update("""
                INSERT INTO crm.company_units (id, tenant_id, company_id, tipo, endereco, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, now(), now())
                """, UUID.randomUUID(), tenant, UUID.fromString(empresa), tipo, endereco);
    }

    private String criarEmpresa(UUID tenant, String razaoSocial) throws Exception {
        String resposta = mvc.perform(post("/api/crm/empresas")
                        .with(usuario(tenant, EMPRESA_CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"razaoSocial\":\"" + razaoSocial + "\",\"origem\":\"manual\",\"origemModuloId\":\"crm\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.data.id");
    }

    private String criarContato(UUID tenant, String empresa, String nome, String email) throws Exception {
        String resposta = mvc.perform(post(CONTATOS)
                        .with(usuario(tenant, CRIAR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoContato(empresa, nome, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.data.id");
    }

    private static String corpoContato(String empresa, String nome, String email) {
        String campoEmail = email == null ? "" : ",\"email\":\"" + email + "\"";
        return "{\"empresaId\":\"" + empresa + "\",\"nome\":\"" + nome + "\"" + campoEmail + ",\"cargo\":\"Gerente\"}";
    }
}
