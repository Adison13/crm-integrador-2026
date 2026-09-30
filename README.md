# CRM — Grupo 6

Módulo CRM do Sistema Integrado de Gestão do Projeto Integrador 2026 (PUC Goiás), para a
Centinela Soluções Digitais. O CRM é o dono do cadastro de empresas, contatos e unidades para
todo o sistema e controla o processo comercial até a oportunidade ser ganha, quando avisa os
módulos de Contratos e Financeiro por evento.

| | |
|---|---|
| Código do módulo | `crm` |
| API | porta `8082`, prefixo `/api/crm` |
| Front | porta `3002`, servido em `/modulos/crm/` |
| Banco | schema `crm` no PostgreSQL compartilhado |
| Contrato | [`contratos/crm.yaml`](https://github.com/karolAlbuquerque/infra-integrador-2026/blob/main/contratos/crm.yaml) e [`contratos/crm.asyncapi.yaml`](https://github.com/karolAlbuquerque/infra-integrador-2026/blob/main/contratos/crm.asyncapi.yaml) |
| Imagens | `ghcr.io/adison13/crm` e `ghcr.io/adison13/crm-front` |

## O que já está pronto

| Recurso | Endpoints | Regras principais |
|---|---|---|
| Empresas | `/empresas`, `/empresas/{id}`, `/empresas/{id}/resumo`, `/empresas/resumo?ids=` | CNPJ único por tenant (409 com `data.empresaId`); leitura completa ou resumida conforme a permissão |
| Contatos | `/contatos`, `/contatos/{id}`, `/contatos/{id}/resumo`, `/contatos/resumo?ids=`, `/empresas/{id}/contatos` | E-mail único por empresa (409 com `data.contatoId`); origem e UTM gravadas na criação |
| Unidades | `/empresas/{id}/unidades` | Matriz primeiro |
| Funis e etapas | `/funis`, `/funis/{id}`, `/funis/{id}/etapas`, `/funis/{id}/etapas/ordem`, `/etapas/{id}` | Funil padrão criado no primeiro acesso do tenant; etapa com oportunidades não é removida |
| Oportunidades | `/oportunidades`, `/oportunidades/{id}`, `/oportunidades/{id}/mover`, `/ganhar`, `/perder` | Recorte por dono e equipe; próximo passo obrigatório enquanto aberta; motivo obrigatório na perda |
| Busca global | `/busca?q=` | Até 5 resultados de empresas e contatos, no formato comum da casca |
| Saúde | `/health` | Sem token |

Toda resposta usa o envelope `{ success, data, message, errors }`, o tenant vem sempre do token e
registro de outro tenant responde 404.

### Eventos publicados em `crm.eventos`

| Evento | Quando | Quem consome |
|---|---|---|
| `crm.oportunidade.criada` | Oportunidade criada, por usuário ou pela landing | Marketing |
| `crm.oportunidade.ganha` | Oportunidade marcada como ganha | Contratos e Financeiro |

Os eventos saem só depois do commit da transação e com `user_id = mq_crm`.

## Estrutura

```
api/     back-end Spring Boot 3.5 (Java 21), migrations Flyway em src/main/resources/db/migration
front/   front React + TypeScript (Vite), carregado pela casca da plataforma
.github/ CI: testes em todo push e publicação das imagens a cada push na main
```

Pacotes do back-end: `empresa`, `contato`, `funil`, `oportunidade`, `busca`, `eventos`,
`seguranca`, `tenant` e `api` (envelope, paginação e tratamento de erros).

## Rodar localmente

O módulo sobe junto com a infraestrutura comum do
[`infra-integrador-2026`](https://github.com/karolAlbuquerque/infra-integrador-2026), clonado ao
lado deste repositório.

1. No `infra-integrador-2026`, gere o `.env` (no Windows, pelo Git Bash):

   ```bash
   scripts/gerar-env.sh
   ```

2. Para usar a imagem publicada:

   ```bash
   docker compose up -d crm crm-front
   ```

   Para compilar a partir deste repositório, crie no `infra-integrador-2026` um
   `docker-compose.override.yml` (não versionado):

   ```yaml
   services:
     crm:
       image: crm-local
       build: ../crm-integrador-2026/api
     crm-front:
       image: crm-front-local
       build: ../crm-integrador-2026/front
   ```

   e rode `docker compose up -d --build crm crm-front`.

3. Confira em http://localhost:8082/api/crm/health e http://localhost:3002/modulos/crm/.

Enquanto o login da plataforma não estiver publicado, os endpoints protegidos são exercitados
pelos testes, com tokens simulados.

## Testes

Precisa de Java 21, Maven e Docker (o Testcontainers sobe um PostgreSQL temporário):

```bash
cd api
mvn verify
```

Cobrem autenticação e permissões (401 e 403), isolamento entre tenants, token de serviço,
duplicidade de empresa e contato, funis e etapas, o ciclo de vida da oportunidade, a publicação
dos eventos e a busca global.

## Equipe

| Integrante | Papel |
|---|---|
| Adison de Oliveira Gontijo Magalhães | Gerente de projeto, back-end e DevOps |
| Helwi | Análise e documentação |
| Rafaela | UX/UI, prototipação e apoio ao back-end |
| Arthur | QA e testes |
| Matteo | QA e testes |
