package br.com.plataforma.crm.prospeccao;

import java.util.UUID;

import br.com.plataforma.crm.empresa.Empresa;

public record ItemProspeccao(UUID id, String razaoSocial, String nomeFantasia, String cnpj, String segmento,
                             String porte, String cidade, String estado, UUID vendedorResponsavel,
                             String statusComercial, long totalTentativas, TentativaDto ultimaTentativa) {

    static ItemProspeccao de(Empresa e, long totalTentativas, TentativaDto ultimaTentativa) {
        return new ItemProspeccao(e.getId(), e.getRazaoSocial(), e.getNomeFantasia(), e.getCnpj(), e.getSegmento(),
                e.getPorte(), e.getCidade(), e.getEstado(), e.getVendedorResponsavel(), e.getStatusComercial(),
                totalTentativas, ultimaTentativa);
    }
}
