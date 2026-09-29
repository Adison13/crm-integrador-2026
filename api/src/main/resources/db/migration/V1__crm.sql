CREATE TABLE crm.companies (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL,
  razao_social       varchar(255) NOT NULL,
  nome_fantasia      varchar(255),
  cnpj               varchar(14),
  segmento           varchar(100),
  porte              varchar(50),
  cidade             varchar(100),
  estado             varchar(2),
  vendedor_responsavel uuid,
  status_comercial   varchar(20) NOT NULL DEFAULT 'lead',
  origem             varchar(30) NOT NULL,
  origem_modulo_id   varchar(100) NOT NULL,
  created_at         timestamptz NOT NULL,
  updated_at         timestamptz NOT NULL,
  deleted_at         timestamptz,
  created_by         uuid,
  updated_by         uuid
);
CREATE INDEX idx_companies_tenant ON crm.companies (tenant_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_companies_tenant_cnpj ON crm.companies (tenant_id, cnpj) WHERE deleted_at IS NULL AND cnpj IS NOT NULL;

CREATE TABLE crm.company_units (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL,
  company_id  uuid NOT NULL REFERENCES crm.companies (id),
  tipo        varchar(20) NOT NULL,
  endereco    varchar(255),
  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz,
  created_by  uuid,
  updated_by  uuid
);
CREATE INDEX idx_company_units_company ON crm.company_units (company_id) WHERE deleted_at IS NULL;

CREATE TABLE crm.contacts (
  id                        uuid PRIMARY KEY,
  tenant_id                 uuid NOT NULL,
  company_id                uuid NOT NULL REFERENCES crm.companies (id),
  nome                      varchar(255) NOT NULL,
  cargo                     varchar(100),
  email                     varchar(255),
  telefone                  varchar(20),
  papel                     varchar(30),
  consentimento_lgpd        varchar(20),
  preferencia_comunicacao   varchar(20),
  origem                    varchar(30),
  origem_modulo_id          varchar(100),
  utm_source                varchar(100),
  utm_medium                varchar(100),
  utm_campaign              varchar(100),
  created_at                timestamptz NOT NULL,
  updated_at                timestamptz NOT NULL,
  deleted_at                timestamptz,
  created_by                uuid,
  updated_by                uuid
);
CREATE INDEX idx_contacts_company ON crm.contacts (company_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_contacts_company_email ON crm.contacts (company_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE TABLE crm.eventos_processados (
  evento_id     uuid PRIMARY KEY,
  tipo          text NOT NULL,
  processado_em timestamptz NOT NULL DEFAULT now()
);

CREATE VIEW crm.vw_pub_empresas AS
  SELECT id, tenant_id, razao_social, cnpj, cidade, created_at
    FROM crm.companies
   WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usr_chamados') THEN
    GRANT USAGE  ON SCHEMA crm            TO usr_chamados;
    GRANT SELECT ON crm.vw_pub_empresas   TO usr_chamados;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usr_financeiro') THEN
    GRANT USAGE  ON SCHEMA crm            TO usr_financeiro;
    GRANT SELECT ON crm.vw_pub_empresas   TO usr_financeiro;
  END IF;
END $$;
