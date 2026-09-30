package br.com.plataforma.crm.atividade;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.oportunidade.Recorte;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm")
public class AtividadeController {

    private final AtividadeServico servico;

    public AtividadeController(AtividadeServico servico) {
        this.servico = servico;
    }

    @GetMapping("/oportunidades/{id}/atividades")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<Pagina<AtividadeDto>> atividades(@PathVariable UUID id,
                                                     @RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "20") int tamanho,
                                                     @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        PageRequest pedido = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 100));
        return Resposta.ok(servico.atividades(id, Recorte.de(jwt, autenticacao), pedido));
    }

    @PostMapping("/oportunidades/{id}/atividades")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public ResponseEntity<Resposta<AtividadeDto>> registrar(@PathVariable UUID id, @Valid @RequestBody NovaAtividade corpo,
                                                            @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Resposta.ok(servico.registrar(id, corpo, Recorte.de(jwt, autenticacao))));
    }

    @DeleteMapping("/atividades/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<Void> excluirAtividade(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                           Authentication autenticacao) {
        servico.excluirAtividade(id, Recorte.de(jwt, autenticacao));
        return Resposta.ok(null);
    }

    @GetMapping("/oportunidades/{id}/objecoes")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<List<ObjecaoDto>> objecoes(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                               Authentication autenticacao) {
        return Resposta.ok(servico.objecoes(id, Recorte.de(jwt, autenticacao)));
    }

    @PostMapping("/oportunidades/{id}/objecoes")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public ResponseEntity<Resposta<ObjecaoDto>> registrarObjecao(@PathVariable UUID id,
                                                                 @Valid @RequestBody NovaObjecao corpo,
                                                                 @AuthenticationPrincipal Jwt jwt,
                                                                 Authentication autenticacao) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Resposta.ok(servico.registrarObjecao(id, corpo, Recorte.de(jwt, autenticacao))));
    }

    @GetMapping("/objecoes/frequentes")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<List<ObjecaoFrequenteDto>> frequentes() {
        return Resposta.ok(servico.frequentes());
    }

    @DeleteMapping("/objecoes/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<Void> excluirObjecao(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                         Authentication autenticacao) {
        servico.excluirObjecao(id, Recorte.de(jwt, autenticacao));
        return Resposta.ok(null);
    }
}
