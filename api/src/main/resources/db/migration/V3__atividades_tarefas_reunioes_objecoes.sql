CREATE TABLE crm.activities (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  opportunity_id  uuid NOT NULL REFERENCES crm.opportunities (id),
  tipo            varchar(30) NOT NULL CHECK (tipo IN ('ligacao', 'email', 'whatsapp', 'visita', 'outro')),
  descricao       text NOT NULL,
  realizada_em    timestamptz NOT NULL,
  responsavel_id  uuid,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL,
  deleted_at      timestamptz,
  created_by      uuid,
  updated_by      uuid
);
CREATE INDEX idx_activities_opportunity ON crm.activities (opportunity_id, realizada_em DESC) WHERE deleted_at IS NULL;

CREATE TABLE crm.tasks (
  id               uuid PRIMARY KEY,
  tenant_id        uuid NOT NULL,
  opportunity_id   uuid REFERENCES crm.opportunities (id),
  descricao        varchar(500) NOT NULL,
  tipo             varchar(30) CHECK (tipo IN ('ligacao', 'email', 'whatsapp', 'visita', 'reuniao', 'follow_up', 'outro')),
  responsavel_id   uuid,
  data_vencimento  timestamptz,
  status           varchar(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida')),
  concluida_em     timestamptz,
  created_at       timestamptz NOT NULL,
  updated_at       timestamptz NOT NULL,
  deleted_at       timestamptz,
  created_by       uuid,
  updated_by       uuid
);
CREATE INDEX idx_tasks_responsavel ON crm.tasks (tenant_id, responsavel_id, status, data_vencimento) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_opportunity ON crm.tasks (opportunity_id) WHERE deleted_at IS NULL;

CREATE TABLE crm.meetings (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  opportunity_id  uuid NOT NULL REFERENCES crm.opportunities (id),
  data_hora       timestamptz NOT NULL,
  participantes   text,
  local_ou_link   varchar(255),
  pauta           text,
  resumo          text,
  proximo_passo   varchar(255),
  registrada_em   timestamptz,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL,
  deleted_at      timestamptz,
  created_by      uuid,
  updated_by      uuid
);
CREATE INDEX idx_meetings_agenda ON crm.meetings (tenant_id, data_hora) WHERE deleted_at IS NULL;
CREATE INDEX idx_meetings_opportunity ON crm.meetings (opportunity_id) WHERE deleted_at IS NULL;

CREATE TABLE crm.objections (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  opportunity_id  uuid NOT NULL REFERENCES crm.opportunities (id),
  meeting_id      uuid REFERENCES crm.meetings (id),
  motivo          varchar(255) NOT NULL,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL,
  deleted_at      timestamptz,
  created_by      uuid,
  updated_by      uuid
);
CREATE INDEX idx_objections_opportunity ON crm.objections (opportunity_id) WHERE deleted_at IS NULL;
