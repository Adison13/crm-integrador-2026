package br.com.plataforma.crm.funil;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.seguranca.Usuarios;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm")
public class FunilController {

    private final FunilServico servico;

    public FunilController(FunilServico servico) {
        this.servico = servico;
    }

    @GetMapping("/funis")
    @PreAuthorize("hasAuthority('crm.funil.ver')")
    public Resposta<List<FunilDto>> listar(@AuthenticationPrincipal Jwt jwt) {
        return Resposta.ok(servico.listar(Usuarios.idDe(jwt)));
    }

    @PostMapping("/funis")
    @PreAuthorize("hasAuthority('crm.funil.administrar')")
    public ResponseEntity<Resposta<FunilDto>> criar(@Valid @RequestBody NovoFunil corpo, @AuthenticationPrincipal Jwt jwt) {
        FunilDto funil = servico.criar(corpo, Usuarios.idDe(jwt));
        return ResponseEntity.created(URI.create("/api/crm/funis/" + funil.id())).body(Resposta.ok(funil));
    }

    @GetMapping("/funis/{id}")
    @PreAuthorize("hasAuthority('crm.funil.ver')")
    public Resposta<FunilDto> ver(@PathVariable UUID id) {
        return Resposta.ok(servico.ver(id));
    }

    @PutMapping("/funis/{id}")
    @PreAuthorize("hasAuthority('crm.funil.administrar')")
    public Resposta<FunilDto> editar(@PathVariable UUID id, @Valid @RequestBody EditarFunil corpo,
                                     @AuthenticationPrincipal Jwt jwt) {
        return Resposta.ok(servico.editar(id, corpo, Usuarios.idDe(jwt)));
    }

    @DeleteMapping("/funis/{id}")
    @PreAuthorize("hasAuthority('crm.funil.administrar')")
    public Resposta<Void> excluir(@PathVariable UUID id) {
        servico.excluir(id);
        return Resposta.ok(null);
    }

    @PostMapping("/funis/{id}/etapas")
    @PreAuthorize("hasAuthority('crm.funil.administrar')")
    public ResponseEntity<Resposta<EtapaDto>> criarEtapa(@PathVariable UUID id, @Valid @RequestBody NovaEtapa corpo,
                                                          @AuthenticationPrincipal Jwt jwt) {
        EtapaDto etapa = servico.criarEtapa(id, corpo, Usuarios.idDe(jwt));
        return ResponseEntity.created(URI.create("/api/crm/etapas/" + etapa.id())).body(Resposta.ok(etapa));
    }

    @PutMapping("/funis/{id}/etapas/ordem")
    @PreAuthorize("hasAuthority('crm.funil.administrar')")
    public Resposta<FunilDto> reordenar(@PathVariable UUID id, @Valid @RequestBody OrdemEtapas corpo,
                                        @AuthenticationPrincipal Jwt jwt) {
        return Resposta.ok(servico.reordenar(id, corpo, Usuarios.idDe(jwt)));
    }

    @PutMapping("/etapas/{id}")
    @PreAuthorize("hasAuthority('crm.funil.administrar')")
    public Resposta<EtapaDto> editarEtapa(@PathVariable UUID id, @Valid @RequestBody NovaEtapa corpo,
                                          @AuthenticationPrincipal Jwt jwt) {
        return Resposta.ok(servico.editarEtapa(id, corpo, Usuarios.idDe(jwt)));
    }

    @DeleteMapping("/etapas/{id}")
    @PreAuthorize("hasAuthority('crm.funil.administrar')")
    public Resposta<Void> excluirEtapa(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        servico.excluirEtapa(id, Usuarios.idDe(jwt));
        return Resposta.ok(null);
    }
}
