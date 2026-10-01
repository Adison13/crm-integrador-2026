package br.com.plataforma.crm.atividade;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.oportunidade.Recorte;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm")
public class TarefaController {

    private static final String EDITAR = "crm.oportunidade.editar";

    private final TarefaServico servico;

    public TarefaController(TarefaServico servico) {
        this.servico = servico;
    }

    @GetMapping("/tarefas")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<Pagina<TarefaDto>> doResponsavel(@RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "20") int tamanho,
                                                     @RequestParam(required = false) String status,
                                                     @RequestParam(required = false) Boolean vencidas,
                                                     @RequestParam(required = false) UUID responsavelId,
                                                     @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        if (status != null && !status.matches("pendente|concluida")) {
            throw new CampoInvalidoException("status", "CAMPO_INVALIDO", "Status deve ser pendente ou concluida.");
        }
        PageRequest pedido = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 100));
        return Resposta.ok(servico.doResponsavel(responsavelId, status, vencidas, Recorte.de(jwt, autenticacao), pedido));
    }

    @PostMapping("/tarefas")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public ResponseEntity<Resposta<TarefaDto>> criar(@Valid @RequestBody NovaTarefa corpo,
                                                     @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        TarefaDto criado = servico.criar(corpo, Recorte.de(jwt, autenticacao));
        return ResponseEntity.created(URI.create("/api/crm/tarefas/" + criado.id())).body(Resposta.ok(criado));
    }

    @PutMapping("/tarefas/{id}")
    @PreAuthorize("hasAnyAuthority('crm.oportunidade.editar', 'crm.oportunidade.ver')")
    public Resposta<TarefaDto> editar(@PathVariable UUID id, @Valid @RequestBody EditarTarefa corpo,
                                      @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return Resposta.ok(servico.editar(id, corpo, Recorte.de(jwt, autenticacao), editor(autenticacao)));
    }

    @PostMapping("/tarefas/{id}/concluir")
    @PreAuthorize("hasAnyAuthority('crm.oportunidade.editar', 'crm.oportunidade.ver')")
    public Resposta<TarefaDto> concluir(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                        Authentication autenticacao) {
        return Resposta.ok(servico.concluir(id, Recorte.de(jwt, autenticacao), editor(autenticacao)));
    }

    @DeleteMapping("/tarefas/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<Void> excluir(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        servico.excluir(id, Recorte.de(jwt, autenticacao));
        return Resposta.ok(null);
    }

    @GetMapping("/oportunidades/{id}/tarefas")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<List<TarefaDto>> daOportunidade(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                                    Authentication autenticacao) {
        return Resposta.ok(servico.daOportunidade(id, Recorte.de(jwt, autenticacao)));
    }

    private static boolean editor(Authentication autenticacao) {
        return autenticacao.getAuthorities().stream().anyMatch(a -> EDITAR.equals(a.getAuthority()));
    }
}
