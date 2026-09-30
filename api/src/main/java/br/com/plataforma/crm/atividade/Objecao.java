package br.com.plataforma.crm.atividade;

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

/** Motivo que fez o cliente hesitar, registrado por oportunidade. */
@Entity
@Table(name = "objections")
@SQLDelete(sql = "UPDATE crm.objections SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Objecao implements Persistable<UUID> {

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "opportunity_id", nullable = false, updatable = false)
    private UUID oportunidadeId;

    @Column(name = "meeting_id", updatable = false)
    private UUID reuniaoId;

    @Column(nullable = false, length = 255)
    private String motivo;

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

    protected Objecao() {
    }

    public static Objecao nova(UUID oportunidadeId, UUID reuniaoId, String motivo, UUID usuario) {
        Objecao o = new Objecao();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        o.id = UUID.randomUUID();
        o.criadoEm = agora;
        o.atualizadoEm = agora;
        o.criadoPor = usuario;
        o.atualizadoPor = usuario;
        o.novo = true;
        o.oportunidadeId = oportunidadeId;
        o.reuniaoId = reuniaoId;
        o.motivo = motivo;
        return o;
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

    public UUID getCriadoPor() {
        return criadoPor;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public UUID getOportunidadeId() {
        return oportunidadeId;
    }

    public UUID getReuniaoId() {
        return reuniaoId;
    }

    public String getMotivo() {
        return motivo;
    }
}
