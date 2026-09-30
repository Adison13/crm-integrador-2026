package br.com.plataforma.crm.atividade;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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

import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.oportunidade.Recorte;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm")
public class ReuniaoController {

    private final ReuniaoServico servico;

    public ReuniaoController(ReuniaoServico servico) {
        this.servico = servico;
    }

    @GetMapping("/reunioes")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<List<ReuniaoDto>> agenda(@RequestParam LocalDate de, @RequestParam LocalDate ate,
                                            @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return Resposta.ok(servico.agenda(de, ate, Recorte.de(jwt, autenticacao)));
    }

    @GetMapping("/oportunidades/{id}/reunioes")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<List<ReuniaoDto>> daOportunidade(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                                     Authentication autenticacao) {
        return Resposta.ok(servico.daOportunidade(id, Recorte.de(jwt, autenticacao)));
    }

    @PostMapping("/oportunidades/{id}/reunioes")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public ResponseEntity<Resposta<ReuniaoDto>> agendar(@PathVariable UUID id, @Valid @RequestBody NovaReuniao corpo,
                                                        @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        ReuniaoDto criado = servico.agendar(id, corpo, Recorte.de(jwt, autenticacao));
        return ResponseEntity.created(URI.create("/api/crm/reunioes/" + criado.id())).body(Resposta.ok(criado));
    }

    @PutMapping("/reunioes/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<ReuniaoDto> reagendar(@PathVariable UUID id, @Valid @RequestBody NovaReuniao corpo,
                                          @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return Resposta.ok(servico.reagendar(id, corpo, Recorte.de(jwt, autenticacao)));
    }

    @DeleteMapping("/reunioes/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<Void> cancelar(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        servico.cancelar(id, Recorte.de(jwt, autenticacao));
        return Resposta.ok(null);
    }

    @PostMapping("/reunioes/{id}/registro")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<ReuniaoDto> registrar(@PathVariable UUID id, @Valid @RequestBody RegistroReuniao corpo,
                                          @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return Resposta.ok(servico.registrar(id, corpo, Recorte.de(jwt, autenticacao)));
    }
}
