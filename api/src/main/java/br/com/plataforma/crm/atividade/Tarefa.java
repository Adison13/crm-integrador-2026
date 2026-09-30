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

/** O que ainda precisa ser feito, com responsável e vencimento; pode existir sem oportunidade. */
@Entity
@Table(name = "tasks")
@SQLDelete(sql = "UPDATE crm.tasks SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Tarefa implements Persistable<UUID> {

    public static final String PENDENTE = "pendente";
    public static final String CONCLUIDA = "concluida";

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "opportunity_id", updatable = false)
    private UUID oportunidadeId;

    @Column(nullable = false, length = 500)
    private String descricao;

    @Column(length = 30)
    private String tipo;

    @Column(name = "responsavel_id")
    private UUID responsavelId;

    @Column(name = "data_vencimento")
    private OffsetDateTime dataVencimento;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "concluida_em")
    private OffsetDateTime concluidaEm;

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

    protected Tarefa() {
    }

    public static Tarefa nova(UUID oportunidadeId, String descricao, String tipo, UUID responsavelId,
                              OffsetDateTime dataVencimento, UUID usuario) {
        Tarefa t = new Tarefa();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        t.id = UUID.randomUUID();
        t.criadoEm = agora;
        t.atualizadoEm = agora;
        t.criadoPor = usuario;
        t.atualizadoPor = usuario;
        t.novo = true;
        t.oportunidadeId = oportunidadeId;
        t.descricao = descricao;
        t.tipo = tipo;
        t.responsavelId = responsavelId;
        t.dataVencimento = dataVencimento;
        t.status = PENDENTE;
        return t;
    }

    public void editar(String descricao, String tipo, UUID responsavelId, OffsetDateTime dataVencimento, UUID usuario) {
        this.descricao = descricao;
        this.tipo = tipo;
        this.responsavelId = responsavelId;
        this.dataVencimento = dataVencimento;
        tocar(usuario);
    }

    public void concluir(UUID usuario) {
        this.status = CONCLUIDA;
        this.concluidaEm = OffsetDateTime.now(ZoneOffset.UTC);
        tocar(usuario);
    }

    public boolean estaPendente() {
        return PENDENTE.equals(status);
    }

    public boolean vencida(OffsetDateTime agora) {
        return estaPendente() && dataVencimento != null && dataVencimento.isBefore(agora);
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

    public UUID getCriadoPor() {
        return criadoPor;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public UUID getOportunidadeId() {
        return oportunidadeId;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getTipo() {
        return tipo;
    }

    public UUID getResponsavelId() {
        return responsavelId;
    }

    public OffsetDateTime getDataVencimento() {
        return dataVencimento;
    }

    public String getStatus() {
        return status;
    }

    public OffsetDateTime getConcluidaEm() {
        return concluidaEm;
    }
}
