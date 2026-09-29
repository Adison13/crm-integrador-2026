package br.com.plataforma.crm.empresa;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.Pagina;
import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.seguranca.Usuarios;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/crm/empresas")
public class EmpresaController {

    private static final Map<String, String> CAMPOS_ORDENAVEIS = Map.of("criadoEm", "criadoEm", "razaoSocial", "razaoSocial");

    private final EmpresaServico servico;

    public EmpresaController(EmpresaServico servico) {
        this.servico = servico;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('crm.empresa.ver')")
    public Resposta<Pagina<EmpresaDto>> listar(@RequestParam(defaultValue = "0") int pagina,
                                               @RequestParam(defaultValue = "20") int tamanho,
                                               @RequestParam(defaultValue = "criadoEm,desc") String ordenar) {
        PageRequest pedido = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 100), ordenacao(ordenar));
        return Resposta.ok(Pagina.de(servico.listar(pedido), EmpresaDto::de));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('crm.empresa.ver')")
    public Resposta<EmpresaDto> ver(@PathVariable UUID id) {
        return Resposta.ok(EmpresaDto.de(servico.buscar(id)));
    }

    @GetMapping("/{id}/resumo")
    @PreAuthorize("hasAuthority('crm.empresa.ver_resumo')")
    public Resposta<EmpresaResumoDto> verResumo(@PathVariable UUID id) {
        return Resposta.ok(EmpresaResumoDto.de(servico.buscar(id)));
    }

    @GetMapping("/resumo")
    @PreAuthorize("hasAuthority('crm.empresa.ver_resumo')")
    public Resposta<List<EmpresaResumoDto>> resumoEmLote(@RequestParam List<UUID> ids) {
        return Resposta.ok(servico.buscarPorIds(ids).stream().map(EmpresaResumoDto::de).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('crm.empresa.criar')")
    public ResponseEntity<Resposta<EmpresaDto>> criar(@Valid @RequestBody NovaEmpresa corpo, @AuthenticationPrincipal Jwt jwt) {
        Empresa empresa = servico.criar(corpo, Usuarios.idDe(jwt));
        return ResponseEntity.created(URI.create("/api/crm/empresas/" + empresa.getId()))
                .body(Resposta.ok(EmpresaDto.de(empresa)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('crm.empresa.editar')")
    public Resposta<EmpresaDto> editar(@PathVariable UUID id, @Valid @RequestBody EditarEmpresa corpo,
                                       @AuthenticationPrincipal Jwt jwt) {
        Empresa empresa = servico.editar(id, corpo, Usuarios.idDe(jwt));
        return Resposta.ok(EmpresaDto.de(empresa));
    }

    private static Sort ordenacao(String valor) {
        String[] partes = valor.split(",");
        String campo = CAMPOS_ORDENAVEIS.getOrDefault(partes[0].strip(), "criadoEm");
        boolean crescente = partes.length > 1 && partes[1].strip().equalsIgnoreCase("asc");
        return Sort.by(crescente ? Sort.Direction.ASC : Sort.Direction.DESC, campo);
    }
}