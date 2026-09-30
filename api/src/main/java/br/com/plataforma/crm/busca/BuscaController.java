package br.com.plataforma.crm.busca;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.plataforma.crm.api.Resposta;
import br.com.plataforma.crm.contato.Contato;
import br.com.plataforma.crm.contato.ContatoServico;
import br.com.plataforma.crm.empresa.Empresa;
import br.com.plataforma.crm.empresa.EmpresaServico;

/**
 * Busca global chamada pela casca em paralelo com os demais módulos. Contatos entram no
 * resultado só para quem tem crm.contato.ver_resumo, intercalados com as empresas.
 */
@RestController
@RequestMapping("/api/crm/busca")
public class BuscaController {

    private static final int TAMANHO_MINIMO = 2;
    private static final int LIMITE = 5;
    private static final String VER_RESUMO_CONTATO = "crm.contato.ver_resumo";

    private final EmpresaServico empresas;
    private final ContatoServico contatos;

    public BuscaController(EmpresaServico empresas, ContatoServico contatos) {
        this.empresas = empresas;
        this.contatos = contatos;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('crm.empresa.ver_resumo')")
    public Resposta<List<ResultadoBuscaDto>> buscar(@RequestParam(name = "q", defaultValue = "") String q,
                                                    Authentication autenticacao) {
        String termo = q.strip();
        if (termo.length() < TAMANHO_MINIMO) {
            return Resposta.ok(List.of());
        }

        List<ResultadoBuscaDto> deEmpresas = empresas.buscarPorTermo(termo).stream()
                .map(BuscaController::deEmpresa)
                .toList();
        List<ResultadoBuscaDto> deContatos = podeVerContatos(autenticacao)
                ? contatos.buscarPorTermo(termo, LIMITE).stream().map(BuscaController::deContato).toList()
                : List.of();

        return Resposta.ok(intercalar(deEmpresas, deContatos));
    }

    private static boolean podeVerContatos(Authentication autenticacao) {
        return autenticacao.getAuthorities().stream()
                .anyMatch(autoridade -> VER_RESUMO_CONTATO.equals(autoridade.getAuthority()));
    }

    private static List<ResultadoBuscaDto> intercalar(List<ResultadoBuscaDto> a, List<ResultadoBuscaDto> b) {
        List<ResultadoBuscaDto> resultado = new ArrayList<>(LIMITE);
        Iterator<ResultadoBuscaDto> ia = a.iterator();
        Iterator<ResultadoBuscaDto> ib = b.iterator();
        while (resultado.size() < LIMITE && (ia.hasNext() || ib.hasNext())) {
            if (ia.hasNext()) {
                resultado.add(ia.next());
            }
            if (resultado.size() < LIMITE && ib.hasNext()) {
                resultado.add(ib.next());
            }
        }
        return resultado;
    }

    private static ResultadoBuscaDto deEmpresa(Empresa empresa) {
        String titulo = temTexto(empresa.getNomeFantasia()) ? empresa.getNomeFantasia() : empresa.getRazaoSocial();
        String cnpj = empresa.getCnpj() == null ? null : formatarCnpj(empresa.getCnpj());
        String local = empresa.getCidade() == null ? null
                : empresa.getEstado() == null ? empresa.getCidade() : empresa.getCidade() + "/" + empresa.getEstado();
        return new ResultadoBuscaDto(empresa.getId(), titulo, juntar(cnpj, local), "/crm/empresas/" + empresa.getId());
    }

    private static ResultadoBuscaDto deContato(Contato contato) {
        return new ResultadoBuscaDto(contato.getId(), contato.getNome(), juntar(contato.getCargo(), contato.getEmail()),
                "/crm/contatos/" + contato.getId());
    }

    private static String juntar(String primeiro, String segundo) {
        if (temTexto(primeiro) && temTexto(segundo)) {
            return primeiro + " · " + segundo;
        }
        return temTexto(primeiro) ? primeiro : temTexto(segundo) ? segundo : null;
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private static String formatarCnpj(String cnpj) {
        if (cnpj.length() != 14) {
            return cnpj;
        }
        return cnpj.substring(0, 2) + "." + cnpj.substring(2, 5) + "." + cnpj.substring(5, 8) + "/"
                + cnpj.substring(8, 12) + "-" + cnpj.substring(12);
    }
}
