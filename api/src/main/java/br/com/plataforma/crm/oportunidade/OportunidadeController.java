package br.com.plataforma.crm.oportunidade;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm/oportunidades")
public class OportunidadeController {

    private static final Map<String, Sort> ORDENACOES = Map.of(
            "criadoEm,desc", Sort.by(Sort.Direction.DESC, "criadoEm"),
            "criadoEm,asc", Sort.by(Sort.Direction.ASC, "criadoEm"),
            "dataProximoPasso,asc", Sort.by(Sort.Direction.ASC, "dataProximoPasso"),
            "dataPrevistaFechamento,asc", Sort.by(Sort.Direction.ASC, "dataPrevistaFechamento"),
            "valorMrr,desc", Sort.by(Sort.Direction.DESC, "valorMrr"));

    private final OportunidadeServico servico;

    public OportunidadeController(OportunidadeServico servico) {
        this.servico = servico;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<Pagina<OportunidadeDto>> listar(@RequestParam(defaultValue = "0") int pagina,
                                                    @RequestParam(defaultValue = "20") int tamanho,
                                                    @RequestParam(defaultValue = "criadoEm,desc") String ordenar,
                                                    @RequestParam(required = false) UUID funilId,
                                                    @RequestParam(required = false) UUID etapaId,
                                                    @RequestParam(required = false) String status,
                                                    @RequestParam(required = false) UUID responsavelId,
                                                    @RequestParam(required = false) UUID empresaId,
                                                    @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        Sort ordem = ORDENACOES.get(ordenar.replace(" ", ""));
        if (ordem == null) {
            throw new CampoInvalidoException("ordenar", "CAMPO_INVALIDO", "Ordenação não suportada: " + ordenar);
        }
        if (status != null && !status.matches("aberta|ganha|perdida")) {
            throw new CampoInvalidoException("status", "CAMPO_INVALIDO", "Status deve ser aberta, ganha ou perdida.");
        }
        PageRequest pedido = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 100), ordem);
        return Resposta.ok(servico.listar(new Filtros(funilId, etapaId, status, responsavelId, empresaId),
                Recorte.de(jwt, autenticacao), pedido));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('crm.oportunidade.criar')")
    public ResponseEntity<Resposta<OportunidadeDto>> criar(@Valid @RequestBody NovaOportunidade corpo,
                                                           @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        OportunidadeDto criada = servico.criar(corpo, Recorte.de(jwt, autenticacao));
        return ResponseEntity.created(URI.create("/api/crm/oportunidades/" + criada.id())).body(Resposta.ok(criada));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.ver')")
    public Resposta<OportunidadeDto> ver(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                         Authentication autenticacao) {
        return Resposta.ok(servico.ver(id, Recorte.de(jwt, autenticacao)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<OportunidadeDto> editar(@PathVariable UUID id, @Valid @RequestBody EditarOportunidade corpo,
                                            @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return Resposta.ok(servico.editar(id, corpo, Recorte.de(jwt, autenticacao)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('crm.oportunidade.excluir')")
    public Resposta<Void> excluir(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        servico.excluir(id, Recorte.de(jwt, autenticacao));
        return Resposta.ok(null);
    }

    @PostMapping("/{id}/mover")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<OportunidadeDto> mover(@PathVariable UUID id, @Valid @RequestBody MoverOportunidade corpo,
                                           @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return Resposta.ok(servico.mover(id, corpo, Recorte.de(jwt, autenticacao)));
    }

    @PostMapping("/{id}/ganhar")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<OportunidadeDto> ganhar(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt,
                                            Authentication autenticacao) {
        return Resposta.ok(servico.ganhar(id, Recorte.de(jwt, autenticacao)));
    }

    @PostMapping("/{id}/perder")
    @PreAuthorize("hasAuthority('crm.oportunidade.editar')")
    public Resposta<OportunidadeDto> perder(@PathVariable UUID id, @Valid @RequestBody PerderOportunidade corpo,
                                            @AuthenticationPrincipal Jwt jwt, Authentication autenticacao) {
        return Resposta.ok(servico.perder(id, corpo, Recorte.de(jwt, autenticacao)));
    }
}
