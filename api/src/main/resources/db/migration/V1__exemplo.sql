-- Primeira migration do módulo de exemplo. Roda como own_exemplo (Contrato §7.1).

-- Tabela de negócio: as sete colunas obrigatórias da §7.2.
CREATE TABLE exemplo.itens (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL,
  nome        varchar(200) NOT NULL,
  descricao   text,
  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz,
  created_by  uuid,
  updated_by  uuid
);
CREATE INDEX idx_itens_tenant ON exemplo.itens (tenant_id, created_at DESC) WHERE deleted_at IS NULL;

-- Idempotência do consumo de eventos (§9.7): um id processado nunca produz efeito de novo.
CREATE TABLE exemplo.eventos_processados (
  evento_id     uuid PRIMARY KEY,
  tipo          text NOT NULL,
  processado_em timestamptz NOT NULL DEFAULT now()
);

-- View pública somente-leitura para relatórios (§9.8), documentada em contratos/exemplo.views.md.
CREATE VIEW exemplo.vw_pub_itens AS
  SELECT id, tenant_id, nome, created_at
    FROM exemplo.itens
   WHERE deleted_at IS NULL;

-- O IF EXISTS deixa a migration rodar nos testes, onde usr_chamados não existe.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usr_chamados') THEN
    GRANT USAGE  ON SCHEMA exemplo       TO usr_chamados;
    GRANT SELECT ON exemplo.vw_pub_itens TO usr_chamados;
  END IF;
END $$;
