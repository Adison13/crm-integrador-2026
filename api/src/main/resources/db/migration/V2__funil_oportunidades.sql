CREATE TABLE crm.pipelines (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL,
  nome        varchar(100) NOT NULL,
  padrao      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz,
  created_by  uuid,
  updated_by  uuid
);
CREATE INDEX idx_pipelines_tenant ON crm.pipelines (tenant_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_pipelines_tenant_padrao ON crm.pipelines (tenant_id) WHERE padrao AND deleted_at IS NULL;

CREATE TABLE crm.pipeline_stages (
  id           uuid PRIMARY KEY,
  tenant_id    uuid NOT NULL,
  pipeline_id  uuid NOT NULL REFERENCES crm.pipelines (id),
  nome         varchar(100) NOT NULL,
  ordem        integer NOT NULL CHECK (ordem >= 1),
  cor          varchar(10),
  created_at   timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL,
  deleted_at   timestamptz,
  created_by   uuid,
  updated_by   uuid
);
CREATE INDEX idx_pipeline_stages_pipeline ON crm.pipeline_stages (pipeline_id, ordem) WHERE deleted_at IS NULL;

CREATE TABLE crm.opportunities (
  id                        uuid PRIMARY KEY,
  tenant_id                 uuid NOT NULL,
  titulo                    varchar(255) NOT NULL,
  company_id                uuid NOT NULL REFERENCES crm.companies (id),
  contact_id                uuid REFERENCES crm.contacts (id),
  unit_id                   uuid REFERENCES crm.company_units (id),
  stage_id                  uuid NOT NULL REFERENCES crm.pipeline_stages (id),
  tipo                      varchar(20) NOT NULL DEFAULT 'nova' CHECK (tipo IN ('nova', 'upsell', 'cross_sell')),
  product_id                uuid,
  valor_implantacao         numeric(15,2) CHECK (valor_implantacao >= 0),
  valor_mrr                 numeric(15,2) CHECK (valor_mrr >= 0),
  probabilidade             integer CHECK (probabilidade BETWEEN 0 AND 100),
  data_prevista_fechamento  date,
  proximo_passo             varchar(255),
  data_proximo_passo        date,
  responsavel_id            uuid,
  equipe_id                 uuid,
  status                    varchar(20) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'ganha', 'perdida')),
  motivo_perda              varchar(255),
  fechada_em                timestamptz,
  origem                    varchar(30),
  origem_modulo_id          varchar(100),
  created_at                timestamptz NOT NULL,
  updated_at                timestamptz NOT NULL,
  deleted_at                timestamptz,
  created_by                uuid,
  updated_by                uuid,
  CONSTRAINT ck_opportunities_proximo_passo
    CHECK (status <> 'aberta' OR (proximo_passo IS NOT NULL AND data_proximo_passo IS NOT NULL)),
  CONSTRAINT ck_opportunities_motivo_perda
    CHECK (status <> 'perdida' OR motivo_perda IS NOT NULL)
);
CREATE INDEX idx_opportunities_tenant ON crm.opportunities (tenant_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_stage ON crm.opportunities (stage_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_company ON crm.opportunities (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_responsavel ON crm.opportunities (tenant_id, responsavel_id) WHERE deleted_at IS NULL;
