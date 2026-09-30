package br.com.plataforma.crm.funil;

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

/** Fase em aberto de um funil. Ganho e perda não são etapas: ficam no status da oportunidade. */
@Entity
@Table(name = "pipeline_stages")
@SQLDelete(sql = "UPDATE crm.pipeline_stages SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Etapa implements Persistable<UUID> {

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "pipeline_id", nullable = false, updatable = false)
    private UUID funilId;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false)
    private int ordem;

    @Column(length = 10)
    private String cor;

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

    protected Etapa() {
    }

    public static Etapa nova(UUID funilId, String nome, String cor, int ordem, UUID usuario) {
        Etapa etapa = new Etapa();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        etapa.id = UUID.randomUUID();
        etapa.funilId = funilId;
        etapa.nome = nome;
        etapa.cor = cor;
        etapa.ordem = ordem;
        etapa.criadoEm = agora;
        etapa.atualizadoEm = agora;
        etapa.criadoPor = usuario;
        etapa.atualizadoPor = usuario;
        etapa.novo = true;
        return etapa;
    }

    public void editar(String nome, String cor, UUID usuario) {
        this.nome = nome;
        this.cor = cor;
        tocar(usuario);
    }

    public void posicionar(int ordem, UUID usuario) {
        this.ordem = ordem;
        tocar(usuario);
    }

    private void tocar(UUID usuario) {
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

    public UUID getFunilId() {
        return funilId;
    }

    public String getNome() {
        return nome;
    }

    public int getOrdem() {
        return ordem;
    }

    public String getCor() {
        return cor;
    }
}
