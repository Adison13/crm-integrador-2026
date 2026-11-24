-- Views públicas para o motor de relatórios do Grupo 3 (Contrato de Integração §9.8, decisão D9).
-- Somente leitura, sem dados pessoais de contato. O consumidor filtra tenant_id pelo token do usuário.

-- Acrescenta colunas ao fim de vw_pub_empresas: as colunas já publicadas continuam iguais e na mesma ordem.
CREATE OR REPLACE VIEW crm.vw_pub_empresas AS
  SELECT id, tenant_id, razao_social, cnpj, cidade, created_at,
         segmento, porte, estado, status_comercial, vendedor_responsavel, origem
    FROM crm.companies
   WHERE deleted_at IS NULL;

-- Uma linha por oportunidade, já com o funil e a etapa (nome e ordem) para o relatório de funil.
CREATE VIEW crm.vw_pub_oportunidades AS
  SELECT o.id,
         o.tenant_id,
         o.company_id               AS empresa_id,
         p.id                       AS funil_id,
         p.nome                     AS funil_nome,
         o.stage_id                 AS etapa_id,
         s.nome                     AS etapa_nome,
         s.ordem                    AS etapa_ordem,
         o.tipo,
         o.product_id               AS produto_id,
         o.valor_implantacao,
         o.valor_mrr,
         o.probabilidade,
         o.data_prevista_fechamento,
         o.responsavel_id,
         o.equipe_id,
         o.status,
         o.motivo_perda,
         o.fechada_em,
         o.origem,
         o.created_at
    FROM crm.opportunities o
    JOIN crm.pipeline_stages s ON s.id = o.stage_id
    JOIN crm.pipelines p       ON p.id = s.pipeline_id
   WHERE o.deleted_at IS NULL;

-- O IF EXISTS deixa a migration rodar nos testes, onde usr_chamados não existe.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usr_chamados') THEN
    GRANT USAGE  ON SCHEMA crm                 TO usr_chamados;
    GRANT SELECT ON crm.vw_pub_oportunidades   TO usr_chamados;
  END IF;
END $$;
