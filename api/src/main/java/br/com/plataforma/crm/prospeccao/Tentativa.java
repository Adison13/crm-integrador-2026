package br.com.plataforma.crm.prospeccao;

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

/** Uma tentativa de falar com uma empresa em prospecção, com canal e resultado padronizados. */
@Entity
@Table(name = "contact_attempts")
@SQLDelete(sql = "UPDATE crm.contact_attempts SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Tentativa implements Persistable<UUID> {

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID empresaId;

    @Column(name = "contact_id", updatable = false)
    private UUID contatoId;

    @Column(nullable = false, length = 20)
    private String canal;

    @Column(nullable = false, length = 30)
    private String resultado;

    @Column(length = 1000)
    private String observacao;

    @Column(name = "realizada_em", nullable = false)
    private OffsetDateTime realizadaEm;

    @Column(name = "responsavel_id")
    private UUID responsavelId;

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

    @Transient
    private boolean novo;

    protected Tentativa() {
    }

    public static Tentativa nova(UUID empresaId, UUID contatoId, String canal, String resultado, String observacao,
                                 OffsetDateTime realizadaEm, UUID usuario) {
        Tentativa t = new Tentativa();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        t.id = UUID.randomUUID();
        t.criadoEm = agora;
        t.atualizadoEm = agora;
        t.criadoPor = usuario;
        t.atualizadoPor = usuario;
        t.novo = true;
        t.empresaId = empresaId;
        t.contatoId = contatoId;
        t.canal = canal;
        t.resultado = resultado;
        t.observacao = observacao;
        t.realizadaEm = realizadaEm;
        t.responsavelId = usuario;
        return t;
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

    public UUID getEmpresaId() {
        return empresaId;
    }

    public UUID getContatoId() {
        return contatoId;
    }

    public String getCanal() {
        return canal;
    }

    public String getResultado() {
        return resultado;
    }

    public String getObservacao() {
        return observacao;
    }

    public OffsetDateTime getRealizadaEm() {
        return realizadaEm;
    }

    public UUID getResponsavelId() {
        return responsavelId;
    }
}
