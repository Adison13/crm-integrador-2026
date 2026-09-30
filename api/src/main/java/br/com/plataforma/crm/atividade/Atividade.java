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

/** O que já foi feito numa oportunidade: ligação, e-mail, mensagem ou visita. */
@Entity
@Table(name = "activities")
@SQLDelete(sql = "UPDATE crm.activities SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Atividade implements Persistable<UUID> {

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "opportunity_id", nullable = false, updatable = false)
    private UUID oportunidadeId;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

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

    protected Atividade() {
    }

    public static Atividade nova(UUID oportunidadeId, String tipo, String descricao, OffsetDateTime realizadaEm,
                                 UUID usuario) {
        Atividade a = new Atividade();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        a.id = UUID.randomUUID();
        a.criadoEm = agora;
        a.atualizadoEm = agora;
        a.criadoPor = usuario;
        a.atualizadoPor = usuario;
        a.novo = true;
        a.oportunidadeId = oportunidadeId;
        a.tipo = tipo;
        a.descricao = descricao;
        a.realizadaEm = realizadaEm;
        a.responsavelId = usuario;
        return a;
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

    public String getTipo() {
        return tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public OffsetDateTime getRealizadaEm() {
        return realizadaEm;
    }

    public UUID getResponsavelId() {
        return responsavelId;
    }
}
