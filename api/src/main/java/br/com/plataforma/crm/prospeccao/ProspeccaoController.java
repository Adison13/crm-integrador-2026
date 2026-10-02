package br.com.plataforma.crm.prospeccao;

import java.net.URI;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.empresa.FiltroEmpresas;
import br.com.plataforma.crm.oportunidade.OportunidadeDto;
import br.com.plataforma.crm.oportunidade.Recorte;
import br.com.plataforma.crm.seguranca.Usuarios;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm")
public class ProspeccaoController {

    private final ProspeccaoServico servico;

    public ProspeccaoController(ProspeccaoServico servico) {
        this.servico = servico;
    }

    @GetMapping("/prospeccao")
    @PreAuthorize("hasAuthority('crm.prospeccao.ver')")
    public Resposta<Pagina<ItemProspeccao>> listar(@RequestParam(defaultValue = "0") int pagina,
                                                   @RequestParam(defaultValue = "20") int tamanho,
                                                   @RequestParam(required = false) String segmento,
                                                   @RequestParam(required = false) String cidade,
                                                   @RequestParam(required = false) String porte,
                                                   @RequestParam(required = false) UUID vendedorId,
                                                   @RequestParam(required = false) String status) {
        if (status != null && !ProspeccaoServico.STATUS_EM_PROSPECCAO.contains(status)) {
            throw new CampoInvalidoException("status", "CAMPO_INVALIDO", "Status deve ser lead ou prospect.");
        }
        PageRequest pedido = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 100),
                Sort.by("razaoSocial"));
        FiltroEmpresas filtro = new FiltroEmpresas(segmento, ProspeccaoServico.statusDaLista(status), cidade,
                porte, vendedorId);
        return Resposta.ok(servico.listar(filtro, pedido));
    }

    @GetMapping("/empresas/{id}/tentativas")
    @PreAuthorize("hasAuthority('crm.prospeccao.ver')")
    public Resposta<Pagina<TentativaDto>> tentativas(@PathVariable UUID id,
                                                     @RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "20") int tamanho) {
        return Resposta.ok(servico.tentativas(id, PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 100))));
    }

    @PostMapping("/empresas/{id}/tentativas")
    @PreAuthorize("hasAuthority('crm.prospeccao.registrar')")
    public ResponseEntity<Resposta<TentativaDto>> registrar(@PathVariable UUID id,
                                                            @Valid @RequestBody NovaTentativa corpo,
                                                            @AuthenticationPrincipal Jwt jwt) {
        TentativaDto criada = servico.registrar(id, corpo, Usuarios.idDe(jwt));
        return ResponseEntity.created(URI.create("/api/crm/tentativas/" + criada.id()))
                .body(Resposta.ok(criada));
    }

    @DeleteMapping("/tentativas/{id}")
    @PreAuthorize("hasAuthority('crm.prospeccao.registrar')")
    public Resposta<Void> excluir(@PathVariable UUID id) {
        servico.excluir(id);
        return Resposta.ok(null);
    }

    @PostMapping("/empresas/{id}/converter")
    @PreAuthorize("hasAuthority('crm.oportunidade.criar')")
    public ResponseEntity<Resposta<OportunidadeDto>> converter(@PathVariable UUID id,
                                                               @Valid @RequestBody ConverterEmpresa corpo,
                                                               @AuthenticationPrincipal Jwt jwt,
                                                               Authentication autenticacao) {
        OportunidadeDto criada = servico.converter(id, corpo, Recorte.de(jwt, autenticacao));
        return ResponseEntity.created(URI.create("/api/crm/oportunidades/" + criada.id())).body(Resposta.ok(criada));
    }
}
