CREATE TABLE crm.contact_attempts (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  company_id      uuid NOT NULL REFERENCES crm.companies (id),
  contact_id      uuid REFERENCES crm.contacts (id),
  canal           varchar(20) NOT NULL CHECK (canal IN ('telefone', 'email', 'whatsapp', 'linkedin', 'visita')),
  resultado       varchar(30) NOT NULL CHECK (resultado IN ('sem_resposta', 'contato_realizado', 'retornar_depois', 'sem_interesse', 'numero_invalido')),
  observacao      varchar(1000),
  realizada_em    timestamptz NOT NULL,
  responsavel_id  uuid,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL,
  deleted_at      timestamptz,
  created_by      uuid,
  updated_by      uuid
);
CREATE INDEX idx_contact_attempts_company ON crm.contact_attempts (company_id, realizada_em DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_attempts_tenant ON crm.contact_attempts (tenant_id) WHERE deleted_at IS NULL;
