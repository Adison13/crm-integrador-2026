package br.com.plataforma.crm.empresa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.plataforma.crm.api.NaoEncontradoException;

@Service
public class EmpresaServico {

    private final EmpresaRepositorio empresas;

    public EmpresaServico(EmpresaRepositorio empresas) {
        this.empresas = empresas;
    }

    @Transactional(readOnly = true)
    public Page<Empresa> listar(Pageable pagina) {
        return empresas.findAll(pagina);
    }

    @Transactional(readOnly = true)
    public Empresa buscar(UUID id) {
        return empresas.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException("Empresa não encontrada."));
    }

    @Transactional(readOnly = true)
    public List<Empresa> buscarPorIds(List<UUID> ids) {
        return empresas.buscarPorIds(ids);
    }

    @Transactional(readOnly = true)
    public List<Empresa> buscarPorTermo(String termo) {
        return empresas.buscarPorTermo(termo.strip(), PageRequest.of(0, 5));
    }

    @Transactional
    public Empresa criar(NovaEmpresa dados, UUID usuario) {
        if (dados.cnpj() != null) {
            empresas.buscarPorCnpj(dados.cnpj())
                    .ifPresent(existente -> {
                        throw new EmpresaDuplicadaException(existente.getId());
                    });
        }

        return empresas.save(Empresa.nova(
                dados.razaoSocial().strip(),
                dados.nomeFantasia(),
                dados.cnpj(),
                dados.segmento(),
                dados.porte(),
                dados.cidade(),
                dados.estado(),
                dados.origem(),
                dados.origemModuloId(),
                usuario));
    }

    @Transactional
    public Empresa editar(UUID id, EditarEmpresa dados, UUID usuario) {
        Empresa empresa = buscar(id);
        if (dados.cnpj() != null) {
            empresas.buscarPorCnpj(dados.cnpj())
                    .filter(existente -> !existente.getId().equals(id))
                    .ifPresent(existente -> {
                        throw new EmpresaDuplicadaException(existente.getId());
                    });
        }
        empresa.editar(
                dados.razaoSocial().strip(),
                dados.nomeFantasia(),
                dados.cnpj(),
                dados.segmento(),
                dados.porte(),
                dados.cidade(),
                dados.estado(),
                dados.vendedorResponsavel(),
                dados.statusComercial(),
                usuario);
        return empresa;
    }
}
