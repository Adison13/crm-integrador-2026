package br.com.plataforma.crm.contato;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.Lotes;
import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.seguranca.Usuarios;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm")
public class ContatoController {

    private final ContatoServico servico;

    public ContatoController(ContatoServico servico) {
        this.servico = servico;
    }

    @GetMapping("/empresas/{empresaId}/contatos")
    @PreAuthorize("hasAuthority('crm.contato.ver')")
    public Resposta<Pagina<ContatoDto>> daEmpresa(@PathVariable UUID empresaId,
                                                  @RequestParam(defaultValue = "0") int pagina,
                                                  @RequestParam(defaultValue = "20") int tamanho) {
        PageRequest pedido = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 100), Sort.by("nome"));
        return Resposta.ok(Pagina.de(servico.daEmpresa(empresaId, pedido), ContatoDto::de));
    }

    @GetMapping("/contatos/{id}")
    @PreAuthorize("hasAuthority('crm.contato.ver')")
    public Resposta<ContatoDto> ver(@PathVariable UUID id) {
        return Resposta.ok(ContatoDto.de(servico.buscar(id)));
    }

    @GetMapping("/contatos/{id}/resumo")
    @PreAuthorize("hasAuthority('crm.contato.ver_resumo')")
    public Resposta<ContatoResumoDto> verResumo(@PathVariable UUID id) {
        return Resposta.ok(ContatoResumoDto.de(servico.buscar(id)));
    }

    @GetMapping("/contatos/resumo")
    @PreAuthorize("hasAuthority('crm.contato.ver_resumo')")
    public Resposta<List<ContatoResumoDto>> resumoEmLote(@RequestParam List<UUID> ids) {
        return Resposta.ok(servico.buscarPorIds(Lotes.validar(ids)).stream().map(ContatoResumoDto::de).toList());
    }

    @PostMapping("/contatos")
    @PreAuthorize("hasAuthority('crm.contato.criar')")
    public ResponseEntity<Resposta<ContatoDto>> criar(@Valid @RequestBody NovoContato corpo, @AuthenticationPrincipal Jwt jwt) {
        Contato contato = servico.criar(corpo, Usuarios.idDe(jwt));
        return ResponseEntity.created(URI.create("/api/crm/contatos/" + contato.getId()))
                .body(Resposta.ok(ContatoDto.de(contato)));
    }

    @PutMapping("/contatos/{id}")
    @PreAuthorize("hasAuthority('crm.contato.editar')")
    public Resposta<ContatoDto> editar(@PathVariable UUID id, @Valid @RequestBody NovoContato corpo,
                                       @AuthenticationPrincipal Jwt jwt) {
        return Resposta.ok(ContatoDto.de(servico.editar(id, corpo, Usuarios.idDe(jwt))));
    }
}
