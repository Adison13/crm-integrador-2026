package br.com.plataforma.crm.empresa;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EmpresaDto(
        UUID id,
        String razaoSocial,
        String nomeFantasia,
        String cnpj,
        String segmento,
        String porte,
        String cidade,
        String estado,
        UUID vendedorResponsavel,
        String statusComercial,
        String origem,
        String origemModuloId,
        OffsetDateTime criadoEm) {

    static EmpresaDto de(Empresa empresa) {
        return new EmpresaDto(
                empresa.getId(),
                empresa.getRazaoSocial(),
                empresa.getNomeFantasia(),
                empresa.getCnpj(),
                empresa.getSegmento(),
                empresa.getPorte(),
                empresa.getCidade(),
                empresa.getEstado(),
                empresa.getVendedorResponsavel(),
                empresa.getStatusComercial(),
                empresa.getOrigem(),
                empresa.getOrigemModuloId(),
                empresa.getCriadoEm());
    }
}