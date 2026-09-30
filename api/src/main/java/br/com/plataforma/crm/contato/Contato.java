package br.com.plataforma.crm.contato;

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

/** Pessoa de contato vinculada a uma empresa. O CRM é o dono deste cadastro para todo o sistema. */
@Entity
@Table(name = "contacts")
@SQLDelete(sql = "UPDATE crm.contacts SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Contato implements Persistable<UUID> {

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "company_id", nullable = false)
    private UUID empresaId;

    @Column(nullable = false, length = 255)
    private String nome;

    @Column(length = 100)
    private String cargo;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(length = 30)
    private String papel;

    @Column(name = "consentimento_lgpd", length = 20)
    private String consentimentoLgpd;

    @Column(name = "preferencia_comunicacao", length = 20)
    private String preferenciaComunicacao;

    @Column(length = 30, updatable = false)
    private String origem;

    @Column(name = "origem_modulo_id", length = 100, updatable = false)
    private String origemModuloId;

    @Column(name = "utm_source", length = 100, updatable = false)
    private String utmSource;

    @Column(name = "utm_medium", length = 100, updatable = false)
    private String utmMedium;

    @Column(name = "utm_campaign", length = 100, updatable = false)
    private String utmCampaign;

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

    protected Contato() {
    }

    /** Origem e UTM ficam gravadas só na criação: registram de onde o contato veio. */
    public static Contato novo(NovoContato dados, String email, UUID usuario) {
        Contato contato = new Contato();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        contato.id = UUID.randomUUID();
        contato.aplicar(dados, email);
        contato.origem = dados.origem();
        contato.origemModuloId = dados.origemModuloId();
        contato.utmSource = dados.utmSource();
        contato.utmMedium = dados.utmMedium();
        contato.utmCampaign = dados.utmCampaign();
        contato.criadoEm = agora;
        contato.atualizadoEm = agora;
        contato.criadoPor = usuario;
        contato.atualizadoPor = usuario;
        contato.novo = true;
        return contato;
    }

    public void editar(NovoContato dados, String email, UUID usuario) {
        aplicar(dados, email);
        this.atualizadoEm = OffsetDateTime.now(ZoneOffset.UTC);
        this.atualizadoPor = usuario;
    }

    private void aplicar(NovoContato dados, String email) {
        this.empresaId = dados.empresaId();
        this.nome = dados.nome().strip();
        this.cargo = dados.cargo();
        this.email = email;
        this.telefone = dados.telefone();
        this.papel = dados.papel();
        this.consentimentoLgpd = dados.consentimentoLgpd();
        this.preferenciaComunicacao = dados.preferenciaComunicacao();
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

    public String getNome() {
        return nome;
    }

    public String getCargo() {
        return cargo;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getPapel() {
        return papel;
    }

    public String getConsentimentoLgpd() {
        return consentimentoLgpd;
    }

    public String getPreferenciaComunicacao() {
        return preferenciaComunicacao;
    }

    public String getOrigem() {
        return origem;
    }

    public String getOrigemModuloId() {
        return origemModuloId;
    }

    public String getUtmSource() {
        return utmSource;
    }

    public String getUtmMedium() {
        return utmMedium;
    }

    public String getUtmCampaign() {
        return utmCampaign;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}
