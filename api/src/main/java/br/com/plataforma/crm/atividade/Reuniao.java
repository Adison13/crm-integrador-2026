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

/** Reunião de uma oportunidade e, depois de acontecer, o registro do que foi decidido. */
@Entity
@Table(name = "meetings")
@SQLDelete(sql = "UPDATE crm.meetings SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Reuniao implements Persistable<UUID> {

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "opportunity_id", nullable = false, updatable = false)
    private UUID oportunidadeId;

    @Column(name = "data_hora", nullable = false)
    private OffsetDateTime dataHora;

    @Column(columnDefinition = "text")
    private String participantes;

    @Column(name = "local_ou_link", length = 255)
    private String localOuLink;

    @Column(columnDefinition = "text")
    private String pauta;

    @Column(columnDefinition = "text")
    private String resumo;

    @Column(name = "proximo_passo", length = 255)
    private String proximoPasso;

    @Column(name = "registrada_em")
    private OffsetDateTime registradaEm;

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

    protected Reuniao() {
    }

    public static Reuniao nova(UUID oportunidadeId, OffsetDateTime dataHora, String participantes, String localOuLink,
                               String pauta, UUID usuario) {
        Reuniao r = new Reuniao();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        r.id = UUID.randomUUID();
        r.criadoEm = agora;
        r.atualizadoEm = agora;
        r.criadoPor = usuario;
        r.atualizadoPor = usuario;
        r.novo = true;
        r.oportunidadeId = oportunidadeId;
        r.dataHora = dataHora;
        r.participantes = participantes;
        r.localOuLink = localOuLink;
        r.pauta = pauta;
        return r;
    }

    public void reagendar(OffsetDateTime dataHora, String participantes, String localOuLink, String pauta, UUID usuario) {
        this.dataHora = dataHora;
        this.participantes = participantes;
        this.localOuLink = localOuLink;
        this.pauta = pauta;
        tocar(usuario);
    }

    public void registrar(String resumo, String proximoPasso, UUID usuario) {
        this.resumo = resumo;
        this.proximoPasso = proximoPasso;
        this.registradaEm = OffsetDateTime.now(ZoneOffset.UTC);
        tocar(usuario);
    }

    public boolean registrada() {
        return registradaEm != null;
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

    public OffsetDateTime getDataHora() {
        return dataHora;
    }

    public String getParticipantes() {
        return participantes;
    }

    public String getLocalOuLink() {
        return localOuLink;
    }

    public String getPauta() {
        return pauta;
    }

    public String getResumo() {
        return resumo;
    }

    public String getProximoPasso() {
        return proximoPasso;
    }

    public OffsetDateTime getRegistradaEm() {
        return registradaEm;
    }
}
