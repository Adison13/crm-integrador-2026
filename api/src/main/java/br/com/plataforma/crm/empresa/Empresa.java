package br.com.plataforma.crm.empresa;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.TenantId;
import org.springframework.data.domain.Persistable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/**
 * Empresa cliente ou prospect. O CRM é o dono deste cadastro para todo o sistema.
 *
 * {@code @TenantId}: o Hibernate grava o tenant do contexto e filtra as consultas por ele.
 * {@code @SQLDelete} + {@code @SQLRestriction}: excluir marca deleted_at, e registros excluídos
 * somem das consultas (soft delete).
 */
@Entity
@Table(name = "companies")
@SQLDelete(sql = "UPDATE crm.companies SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Empresa implements Persistable<UUID> {

    static final String STATUS_INICIAL = "lead";

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "razao_social", nullable = false, length = 255)
    private String razaoSocial;

    @Column(name = "nome_fantasia", length = 255)
    private String nomeFantasia;

    @Column(length = 14)
    private String cnpj;

    @Column(length = 100)
    private String segmento;

    @Column(length = 50)
    private String porte;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(name = "vendedor_responsavel")
    private UUID vendedorResponsavel;

    @Column(name = "status_comercial", nullable = false, length = 20)
    private String statusComercial;

    @Column(nullable = false, length = 30, updatable = false)
    private String origem;

    @Column(name = "origem_modulo_id", nullable = false, length = 100, updatable = false)
    private String origemModuloId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime atualizadoEm;

    @Column(name = "deleted_at")
    private OffsetDateTime excluidoEm;

    @Column(name = "created_by", updatable = false)
    private UUID criadoPor;

    @Column(name = "updated_by")
    private UUID atualizadoPor;

    /** Id gerado pela aplicação: sem isto, o Spring Data faria um SELECT antes de cada INSERT. */
    @Transient
    private boolean novo;

    protected Empresa() {
    }

    public static Empresa nova(String razaoSocial, String nomeFantasia, String cnpj, String segmento,
                               String porte, String cidade, String estado, String origem,
                               String origemModuloId, UUID usuario) {
        Empresa empresa = new Empresa();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        empresa.id = UUID.randomUUID();
        empresa.razaoSocial = razaoSocial;
        empresa.nomeFantasia = nomeFantasia;
        empresa.cnpj = cnpj;
        empresa.segmento = segmento;
        empresa.porte = porte;
        empresa.cidade = cidade;
        empresa.estado = estado;
        empresa.statusComercial = STATUS_INICIAL;
        empresa.origem = origem;
        empresa.origemModuloId = origemModuloId;
        empresa.criadoEm = agora;
        empresa.atualizadoEm = agora;
        empresa.criadoPor = usuario;
        empresa.atualizadoPor = usuario;
        empresa.novo = true;
        return empresa;
    }

    public void editar(String razaoSocial, String nomeFantasia, String cnpj, String segmento, String porte,
                       String cidade, String estado, UUID vendedorResponsavel, String statusComercial,
                       UUID usuario) {
        this.razaoSocial = razaoSocial;
        this.nomeFantasia = nomeFantasia;
        this.cnpj = cnpj;
        this.segmento = segmento;
        this.porte = porte;
        this.cidade = cidade;
        this.estado = estado;
        this.vendedorResponsavel = vendedorResponsavel;
        if (statusComercial != null && !statusComercial.isBlank()) {
            this.statusComercial = statusComercial;
        }
        this.atualizadoEm = OffsetDateTime.now(ZoneOffset.UTC);
        this.atualizadoPor = usuario;
    }

    @PostLoad
    @PostPersist
    void marcarComoPersistido() {
        novo = false;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return novo;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public String getNomeFantasia() {
        return nomeFantasia;
    }

    public String getCnpj() {
        return cnpj;
    }

    public String getSegmento() {
        return segmento;
    }

    public String getPorte() {
        return porte;
    }

    public String getCidade() {
        return cidade;
    }

    public String getEstado() {
        return estado;
    }

    public UUID getVendedorResponsavel() {
        return vendedorResponsavel;
    }

    public String getStatusComercial() {
        return statusComercial;
    }

    public String getOrigem() {
        return origem;
    }

    public String getOrigemModuloId() {
        return origemModuloId;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
