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

/** Funil de vendas. Cada tenant tem exatamente um funil padrão. */
@Entity
@Table(name = "pipelines")
@SQLDelete(sql = "UPDATE crm.pipelines SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Funil implements Persistable<UUID> {

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false)
    private boolean padrao;

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

    protected Funil() {
    }

    public static Funil novo(String nome, boolean padrao, UUID usuario) {
        Funil funil = new Funil();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        funil.id = UUID.randomUUID();
        funil.nome = nome;
        funil.padrao = padrao;
        funil.criadoEm = agora;
        funil.atualizadoEm = agora;
        funil.criadoPor = usuario;
        funil.atualizadoPor = usuario;
        funil.novo = true;
        return funil;
    }

    public void renomear(String nome, UUID usuario) {
        this.nome = nome;
        tocar(usuario);
    }

    public void definirPadrao(boolean padrao, UUID usuario) {
        this.padrao = padrao;
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

    public String getNome() {
        return nome;
    }

    public boolean isPadrao() {
        return padrao;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}
