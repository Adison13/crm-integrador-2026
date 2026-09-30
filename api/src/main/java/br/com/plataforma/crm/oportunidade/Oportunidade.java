package br.com.plataforma.crm.oportunidade;

import java.math.BigDecimal;
import java.time.LocalDate;
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

/** Negociação com uma empresa. Etapa e status mudam só pelas ações mover, ganhar e perder. */
@Entity
@Table(name = "opportunities")
@SQLDelete(sql = "UPDATE crm.opportunities SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Oportunidade implements Persistable<UUID> {

    public static final String ABERTA = "aberta";
    public static final String GANHA = "ganha";
    public static final String PERDIDA = "perdida";

    @Id
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 255)
    private String titulo;

    @Column(name = "company_id", nullable = false)
    private UUID empresaId;

    @Column(name = "contact_id")
    private UUID contatoId;

    @Column(name = "unit_id")
    private UUID unidadeId;

    @Column(name = "stage_id", nullable = false)
    private UUID etapaId;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "product_id")
    private UUID produtoId;

    @Column(name = "valor_implantacao", precision = 15, scale = 2)
    private BigDecimal valorImplantacao;

    @Column(name = "valor_mrr", precision = 15, scale = 2)
    private BigDecimal valorMrr;

    private Integer probabilidade;

    @Column(name = "data_prevista_fechamento")
    private LocalDate dataPrevistaFechamento;

    @Column(name = "proximo_passo", length = 255)
    private String proximoPasso;

    @Column(name = "data_proximo_passo")
    private LocalDate dataProximoPasso;

    @Column(name = "responsavel_id")
    private UUID responsavelId;

    @Column(name = "equipe_id")
    private UUID equipeId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "motivo_perda", length = 255)
    private String motivoPerda;

    @Column(name = "fechada_em")
    private OffsetDateTime fechadaEm;

    @Column(length = 30, updatable = false)
    private String origem;

    @Column(name = "origem_modulo_id", length = 100, updatable = false)
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

    @Transient
    private boolean novo;

    protected Oportunidade() {
    }

    public static Oportunidade nova(DadosComerciais dados, UUID etapaId, UUID equipeId, String origem,
                                    String origemModuloId, UUID usuario) {
        Oportunidade o = new Oportunidade();
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        o.id = UUID.randomUUID();
        o.aplicar(dados);
        o.etapaId = etapaId;
        o.equipeId = equipeId;
        o.status = ABERTA;
        o.origem = origem;
        o.origemModuloId = origemModuloId;
        o.criadoEm = agora;
        o.atualizadoEm = agora;
        o.criadoPor = usuario;
        o.atualizadoPor = usuario;
        o.novo = true;
        return o;
    }

    public void editar(DadosComerciais dados, UUID usuario) {
        aplicar(dados);
        tocar(usuario);
    }

    public void mover(UUID etapaId, String proximoPasso, LocalDate dataProximoPasso, UUID usuario) {
        this.etapaId = etapaId;
        if (proximoPasso != null) {
            this.proximoPasso = proximoPasso;
            this.dataProximoPasso = dataProximoPasso;
        }
        tocar(usuario);
    }

    public void definirProximoPasso(String proximoPasso, LocalDate dataProximoPasso, UUID usuario) {
        this.proximoPasso = proximoPasso;
        this.dataProximoPasso = dataProximoPasso;
        tocar(usuario);
    }

    public void ganhar(UUID usuario) {
        fechar(GANHA, usuario);
    }

    public void perder(String motivo, UUID usuario) {
        this.motivoPerda = motivo;
        fechar(PERDIDA, usuario);
    }

    public boolean estaAberta() {
        return ABERTA.equals(status);
    }

    public boolean proximoPassoAtrasado(LocalDate hoje) {
        return estaAberta() && dataProximoPasso != null && dataProximoPasso.isBefore(hoje);
    }

    private void fechar(String novoStatus, UUID usuario) {
        this.status = novoStatus;
        this.fechadaEm = OffsetDateTime.now(ZoneOffset.UTC);
        tocar(usuario);
    }

    private void aplicar(DadosComerciais d) {
        this.titulo = d.titulo();
        this.empresaId = d.empresaId();
        this.contatoId = d.contatoId();
        this.unidadeId = d.unidadeId();
        this.tipo = d.tipo();
        this.produtoId = d.produtoId();
        this.valorImplantacao = d.valorImplantacao();
        this.valorMrr = d.valorMrr();
        this.probabilidade = d.probabilidade();
        this.dataPrevistaFechamento = d.dataPrevistaFechamento();
        this.proximoPasso = d.proximoPasso();
        this.dataProximoPasso = d.dataProximoPasso();
        this.responsavelId = d.responsavelId();
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

    public String getTitulo() {
        return titulo;
    }

    public UUID getEmpresaId() {
        return empresaId;
    }

    public UUID getContatoId() {
        return contatoId;
    }

    public UUID getUnidadeId() {
        return unidadeId;
    }

    public UUID getEtapaId() {
        return etapaId;
    }

    public String getTipo() {
        return tipo;
    }

    public UUID getProdutoId() {
        return produtoId;
    }

    public BigDecimal getValorImplantacao() {
        return valorImplantacao;
    }

    public BigDecimal getValorMrr() {
        return valorMrr;
    }

    public Integer getProbabilidade() {
        return probabilidade;
    }

    public LocalDate getDataPrevistaFechamento() {
        return dataPrevistaFechamento;
    }

    public String getProximoPasso() {
        return proximoPasso;
    }

    public LocalDate getDataProximoPasso() {
        return dataProximoPasso;
    }

    public UUID getResponsavelId() {
        return responsavelId;
    }

    public UUID getEquipeId() {
        return equipeId;
    }

    public String getStatus() {
        return status;
    }

    public String getMotivoPerda() {
        return motivoPerda;
    }

    public OffsetDateTime getFechadaEm() {
        return fechadaEm;
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
}
