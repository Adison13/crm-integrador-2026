package br.com.plataforma.crm.busca;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.empresa.Empresa;
import br.com.plataforma.crm.empresa.EmpresaServico;

/** Busca global chamada pela casca em paralelo com os demais módulos. */
@RestController
@RequestMapping("/api/crm/busca")
public class BuscaController {

    private static final int TAMANHO_MINIMO = 2;

    private final EmpresaServico empresas;

    public BuscaController(EmpresaServico empresas) {
        this.empresas = empresas;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('crm.empresa.ver_resumo')")
    public Resposta<List<ResultadoBuscaDto>> buscar(@RequestParam(name = "q", defaultValue = "") String q) {
        String termo = q.strip();
        if (termo.length() < TAMANHO_MINIMO) {
            return Resposta.ok(List.of());
        }
        return Resposta.ok(empresas.buscarPorTermo(termo).stream().map(BuscaController::paraResultado).toList());
    }

    private static ResultadoBuscaDto paraResultado(Empresa empresa) {
        String titulo = empresa.getNomeFantasia() != null && !empresa.getNomeFantasia().isBlank()
                ? empresa.getNomeFantasia()
                : empresa.getRazaoSocial();
        return new ResultadoBuscaDto(empresa.getId(), titulo, subtitulo(empresa), "/crm/empresas/" + empresa.getId());
    }

    private static String subtitulo(Empresa empresa) {
        String cnpj = empresa.getCnpj() == null ? null : formatarCnpj(empresa.getCnpj());
        String local = empresa.getCidade() == null ? null
                : empresa.getEstado() == null ? empresa.getCidade() : empresa.getCidade() + "/" + empresa.getEstado();
        if (cnpj != null && local != null) {
            return cnpj + " · " + local;
        }
        return cnpj != null ? cnpj : local;
    }

    private static String formatarCnpj(String cnpj) {
        if (cnpj.length() != 14) {
            return cnpj;
        }
        return cnpj.substring(0, 2) + "." + cnpj.substring(2, 5) + "." + cnpj.substring(5, 8) + "/"
                + cnpj.substring(8, 12) + "-" + cnpj.substring(12);
    }
}
