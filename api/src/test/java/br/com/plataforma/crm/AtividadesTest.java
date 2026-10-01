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
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.jayway.jsonpath.JsonPath;

class AtividadesTest extends BaseIntegracao {

    private static final String[] VENDEDOR = {
            "crm.empresa.criar", "crm.oportunidade.ver", "crm.oportunidade.criar", "crm.oportunidade.editar"};

    private static final String[] PRE_VENDAS = {"crm.empresa.criar", "crm.oportunidade.ver", "crm.oportunidade.criar"};

    private final String amanha = LocalDate.now().plusDays(1).toString();

    @Test
    void atividadesMaisRecentesPrimeiroESemDataFutura() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        String oportunidade = criarOportunidade(tenant, ana);
        String ontem = OffsetDateTime.now(ZoneOffset.UTC).minusDays(1).toString();

        registrarAtividade(tenant, ana, oportunidade, "{\"tipo\":\"email\",\"descricao\":\"Proposta enviada\",\"realizadaEm\":\"" + ontem + "\"}");
        registrarAtividade(tenant, ana, oportunidade, "{\"tipo\":\"ligacao\",\"descricao\":\"Retorno do sócio\"}");

        mvc.perform(get("/api/crm/oportunidades/" + oportunidade + "/atividades").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.itens[0].tipo").value("ligacao"))
                .andExpect(jsonPath("$.data.itens[0].responsavelId").value(ana.toString()));

        String semana = OffsetDateTime.now(ZoneOffset.UTC).plusDays(7).toString();
        mvc.perform(post("/api/crm/oportunidades/" + oportunidade + "/atividades").with(pessoa(tenant, ana, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"visita\",\"descricao\":\"Visita\",\"realizadaEm\":\"" + semana + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("realizadaEm"));
    }

    @Test
    void atividadeDeOportunidadeDeOutroVendedorResponde404() throws Exception {
        UUID tenant = UUID.randomUUID();
        String daAna = criarOportunidade(tenant, UUID.randomUUID());

        mvc.perform(post("/api/crm/oportunidades/" + daAna + "/atividades")
                        .with(pessoa(tenant, UUID.randomUUID(), List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"ligacao\",\"descricao\":\"Tentativa\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void tarefasDoUsuarioVencidasEConclusao() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        String ontem = OffsetDateTime.now(ZoneOffset.UTC).minusDays(1).toString();
        String semana = OffsetDateTime.now(ZoneOffset.UTC).plusDays(7).toString();

        String vencida = criarTarefa(tenant, ana, "{\"descricao\":\"Ligar para o cliente\",\"dataVencimento\":\"" + ontem + "\"}");
        criarTarefa(tenant, ana, "{\"descricao\":\"Preparar diagnóstico\",\"dataVencimento\":\"" + semana + "\"}");
        criarTarefa(tenant, ana, "{\"descricao\":\"Sem prazo\"}");

        mvc.perform(get("/api/crm/tarefas").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.itens[0].id").value(vencida))
                .andExpect(jsonPath("$.data.itens[0].vencida").value(true))
                .andExpect(jsonPath("$.data.itens[2].descricao").value("Sem prazo"));
        mvc.perform(get("/api/crm/tarefas").param("vencidas", "true").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(jsonPath("$.data.total").value(1));

        mvc.perform(post("/api/crm/tarefas/" + vencida + "/concluir").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("concluida"))
                .andExpect(jsonPath("$.data.vencida").value(false));
        mvc.perform(post("/api/crm/tarefas/" + vencida + "/concluir").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("TAREFA_CONCLUIDA"));
    }

    @Test
    void tarefaSoltaSoAparecePraQuemCriouOuEResponsavel() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        UUID bruno = UUID.randomUUID();
        String tarefa = criarTarefa(tenant, ana, "{\"descricao\":\"Revisar contrato\"}");

        mvc.perform(put("/api/crm/tarefas/" + tarefa).with(pessoa(tenant, bruno, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"descricao\":\"Invadida\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/crm/tarefas").param("responsavelId", ana.toString())
                        .with(pessoa(tenant, bruno, List.of(), VENDEDOR)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/crm/tarefas").param("responsavelId", ana.toString())
                        .with(pessoa(tenant, bruno, List.of(), "crm.oportunidade.ver", "crm.oportunidade.ver_todas")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1));

        mvc.perform(put("/api/crm/tarefas/" + tarefa).with(pessoa(tenant, ana, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"descricao\":\"Revisar contrato com o jurídico\",\"responsavelId\":\"" + bruno + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.responsavelId").value(bruno.toString()));
        mvc.perform(get("/api/crm/tarefas").with(pessoa(tenant, bruno, List.of(), VENDEDOR)))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void preVendasConcluiEEditaSoAPropriaTarefa() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        UUID pedro = UUID.randomUUID();
        String equipe = UUID.randomUUID().toString();
        String oportunidade = criarOportunidade(tenant, ana, List.of(equipe));
        String doPedro = criarTarefa(tenant, ana, "{\"descricao\":\"Qualificar o lead\",\"oportunidadeId\":\""
                + oportunidade + "\",\"responsavelId\":\"" + pedro + "\"}");
        String daAna = criarTarefa(tenant, ana, "{\"descricao\":\"Enviar proposta\",\"oportunidadeId\":\""
                + oportunidade + "\"}");

        mvc.perform(put("/api/crm/tarefas/" + doPedro).with(pessoa(tenant, pedro, List.of(equipe), PRE_VENDAS))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"descricao\":\"Qualificar o lead por telefone\",\"dataVencimento\":\""
                                + OffsetDateTime.now(ZoneOffset.UTC).plusDays(2) + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.responsavelId").value(pedro.toString()));
        mvc.perform(put("/api/crm/tarefas/" + doPedro).with(pessoa(tenant, pedro, List.of(equipe), PRE_VENDAS))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"descricao\":\"Repassar\",\"responsavelId\":\"" + ana + "\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/crm/tarefas/" + daAna + "/concluir").with(pessoa(tenant, pedro, List.of(equipe), PRE_VENDAS)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/crm/tarefas/" + doPedro + "/concluir").with(pessoa(tenant, pedro, List.of(equipe), PRE_VENDAS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("concluida"));
        mvc.perform(delete("/api/crm/tarefas/" + doPedro).with(pessoa(tenant, pedro, List.of(equipe), PRE_VENDAS)))
                .andExpect(status().isForbidden());
    }

    @Test
    void tarefaEmOportunidadeInvisivelResponde400() throws Exception {
        UUID tenant = UUID.randomUUID();
        String daAna = criarOportunidade(tenant, UUID.randomUUID());

        mvc.perform(post("/api/crm/tarefas").with(pessoa(tenant, UUID.randomUUID(), List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"descricao\":\"Seguir\",\"oportunidadeId\":\"" + daAna + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].campo").value("oportunidadeId"));
    }

    @Test
    void registroDeReuniaoAtualizaProximoPassoECriaObjecoes() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        String oportunidade = criarOportunidade(tenant, ana);
        String reuniao = agendarReuniao(tenant, ana, oportunidade, OffsetDateTime.now(ZoneOffset.UTC).plusHours(2));

        String depois = LocalDate.now().plusDays(3).toString();
        mvc.perform(post("/api/crm/reunioes/" + reuniao + "/registro").with(pessoa(tenant, ana, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resumo\":\"Cliente quer backup diário\",\"proximoPasso\":\"Enviar proposta\","
                                + "\"dataProximoPasso\":\"" + depois + "\",\"objecoes\":[\"Preço alto\",\"Já tem fornecedor\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.registrada").value(true))
                .andExpect(jsonPath("$.data.proximoPasso").value("Enviar proposta"));

        mvc.perform(get("/api/crm/oportunidades/" + oportunidade).with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(jsonPath("$.data.proximoPasso").value("Enviar proposta"))
                .andExpect(jsonPath("$.data.dataProximoPasso").value(depois));
        mvc.perform(get("/api/crm/oportunidades/" + oportunidade + "/objecoes").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].reuniaoId").value(reuniao));

        mvc.perform(post("/api/crm/reunioes/" + reuniao + "/registro").with(pessoa(tenant, ana, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resumo\":\"De novo\",\"proximoPasso\":\"X\",\"dataProximoPasso\":\"" + depois + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("REUNIAO_REGISTRADA"));
        mvc.perform(delete("/api/crm/reunioes/" + reuniao).with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isConflict());
    }

    @Test
    void agendaMostraSoAsReunioesQueOUsuarioEnxerga() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        UUID bruno = UUID.randomUUID();
        OffsetDateTime amanhaAsDez = LocalDate.now().plusDays(1).atTime(10, 0).atZone(ZoneId.of("America/Sao_Paulo")).toOffsetDateTime();
        agendarReuniao(tenant, ana, criarOportunidade(tenant, ana), amanhaAsDez);
        agendarReuniao(tenant, bruno, criarOportunidade(tenant, bruno), amanhaAsDez.plusHours(1));

        mvc.perform(get("/api/crm/reunioes").param("de", LocalDate.now().toString()).param("ate", amanha)
                        .with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
        mvc.perform(get("/api/crm/reunioes").param("de", LocalDate.now().toString()).param("ate", amanha)
                        .with(pessoa(tenant, ana, List.of(), "crm.oportunidade.ver", "crm.oportunidade.ver_todas")))
                .andExpect(jsonPath("$.data.length()").value(2));
        mvc.perform(get("/api/crm/reunioes").param("de", amanha).param("ate", LocalDate.now().toString())
                        .with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void naoAgendaReuniaoEmOportunidadeFechada() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        String oportunidade = criarOportunidade(tenant, ana);
        mvc.perform(post("/api/crm/oportunidades/" + oportunidade + "/ganhar").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/crm/oportunidades/" + oportunidade + "/reunioes").with(pessoa(tenant, ana, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dataHora\":\"" + OffsetDateTime.now(ZoneOffset.UTC).plusDays(1) + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].codigo").value("OPORTUNIDADE_FECHADA"));
    }

    @Test
    void objecoesFrequentesAgrupamSemDiferenciarMaiusculas() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID ana = UUID.randomUUID();
        String a = criarOportunidade(tenant, ana);
        String b = criarOportunidade(tenant, ana);
        registrarObjecao(tenant, ana, a, "Preço alto");
        registrarObjecao(tenant, ana, b, "preço alto");
        registrarObjecao(tenant, ana, b, "Já tem fornecedor");

        mvc.perform(get("/api/crm/objecoes/frequentes").with(pessoa(tenant, ana, List.of(), VENDEDOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].motivo").value("preço alto"))
                .andExpect(jsonPath("$.data[0].total").value(2))
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    private String criarOportunidade(UUID tenant, UUID usuario) throws Exception {
        return criarOportunidade(tenant, usuario, List.of());
    }

    private String criarOportunidade(UUID tenant, UUID usuario, List<String> equipes) throws Exception {
        String empresa = JsonPath.read(mvc.perform(post("/api/crm/empresas").with(pessoa(tenant, usuario, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"razaoSocial\":\"Cliente " + UUID.randomUUID() + "\",\"origem\":\"manual\",\"origemModuloId\":\"crm\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
        return JsonPath.read(mvc.perform(post("/api/crm/oportunidades").with(pessoa(tenant, usuario, equipes, VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Backup\",\"empresaId\":\"" + empresa + "\",\"proximoPasso\":\"Ligar\","
                                + "\"dataProximoPasso\":\"" + amanha + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
    }

    private void registrarAtividade(UUID tenant, UUID usuario, String oportunidade, String corpo) throws Exception {
        mvc.perform(post("/api/crm/oportunidades/" + oportunidade + "/atividades").with(pessoa(tenant, usuario, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/crm/atividades/")));
    }

    private String criarTarefa(UUID tenant, UUID usuario, String corpo) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/crm/tarefas").with(pessoa(tenant, usuario, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/crm/tarefas/")))
                .andReturn().getResponse().getContentAsString(), "$.data.id");
    }

    private String agendarReuniao(UUID tenant, UUID usuario, String oportunidade, OffsetDateTime quando) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/crm/oportunidades/" + oportunidade + "/reunioes")
                        .with(pessoa(tenant, usuario, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dataHora\":\"" + quando + "\",\"participantes\":\"Sócio e TI\",\"pauta\":\"Diagnóstico\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/crm/reunioes/"))).andReturn().getResponse().getContentAsString(), "$.data.id");
    }

    private void registrarObjecao(UUID tenant, UUID usuario, String oportunidade, String motivo) throws Exception {
        mvc.perform(post("/api/crm/oportunidades/" + oportunidade + "/objecoes").with(pessoa(tenant, usuario, List.of(), VENDEDOR))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"" + motivo + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/crm/objecoes/")));
    }
}
