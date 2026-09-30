package br.com.plataforma.crm.contato;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.CampoInvalidoException;
import br.com.plataforma.crm.api.NaoEncontradoException;
import br.com.plataforma.crm.empresa.EmpresaRepositorio;
import br.com.plataforma.crm.empresa.EmpresaServico;

@Service
public class ContatoServico {

    private final ContatoRepositorio contatos;
    private final EmpresaRepositorio empresas;
    private final EmpresaServico empresaServico;

    public ContatoServico(ContatoRepositorio contatos, EmpresaRepositorio empresas, EmpresaServico empresaServico) {
        this.contatos = contatos;
        this.empresas = empresas;
        this.empresaServico = empresaServico;
    }

    @Transactional(readOnly = true)
    public Contato buscar(UUID id) {
        return contatos.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException("Contato não encontrado."));
    }

    @Transactional(readOnly = true)
    public List<Contato> buscarPorIds(List<UUID> ids) {
        return contatos.buscarPorIds(ids);
    }

    @Transactional(readOnly = true)
    public Page<Contato> daEmpresa(UUID empresaId, Pageable pagina) {
        empresaServico.buscar(empresaId);
        return contatos.daEmpresa(empresaId, pagina);
    }

    @Transactional(readOnly = true)
    public List<Contato> buscarPorTermo(String termo, int limite) {
        return contatos.buscarPorTermo(termo.strip(), PageRequest.of(0, limite));
    }

    @Transactional
    public Contato criar(NovoContato dados, UUID usuario) {
        String email = normalizarEmail(dados.email());
        validar(dados, email, null);
        return contatos.save(Contato.novo(dados, email, usuario));
    }

    @Transactional
    public Contato editar(UUID id, NovoContato dados, UUID usuario) {
        Contato contato = buscar(id);
        String email = normalizarEmail(dados.email());
        validar(dados, email, id);
        contato.editar(dados, email, usuario);
        return contato;
    }

    private void validar(NovoContato dados, String email, UUID proprioId) {
        if (empresas.buscarPorId(dados.empresaId()).isEmpty()) {
            throw new CampoInvalidoException("empresaId", "EMPRESA_INEXISTENTE", "Empresa não encontrada.");
        }
        if (email != null) {
            contatos.buscarPorEmail(dados.empresaId(), email)
                    .filter(existente -> !existente.getId().equals(proprioId))
                    .ifPresent(existente -> {
                        throw new ContatoDuplicadoException(existente.getId());
                    });
        }
    }

    private static String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.strip().toLowerCase(Locale.ROOT);
    }
}
