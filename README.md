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
| Atividades | `/oportunidades/{id}/atividades`, `/atividades/{id}` | Histórico do que já foi feito; não aceita data futura |
| Tarefas | `/tarefas`, `/tarefas/{id}`, `/tarefas/{id}/concluir`, `/oportunidades/{id}/tarefas` | Minhas tarefas por vencimento e filtro de vencidas; tarefa solta só para quem criou e o responsável |
| Reuniões | `/reunioes?de=&ate=`, `/oportunidades/{id}/reunioes`, `/reunioes/{id}`, `/reunioes/{id}/registro` | Agenda por período; o registro pós-reunião atualiza o próximo passo e grava as objeções |
| Objeções | `/oportunidades/{id}/objecoes`, `/objecoes/{id}`, `/objecoes/frequentes` | Biblioteca dos motivos mais registrados no tenant |
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

Pacotes do back-end: `empresa`, `contato`, `funil`, `oportunidade`, `atividade`, `busca`, `eventos`,
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

## Front

O front chama a API pelo caminho relativo `/api/...`, como em produção (Contrato §12.8). Com a
infraestrutura do `infra-integrador-2026` no ar (gateway em `:8080`):

```bash
cd front
npm install
npm run dev
```

e abra http://localhost:3002/modulos/crm/empresas. Aberto direto no navegador, o front pede login
com um usuário de teste do identity (`docs/usuarios-de-teste.md`); dentro do iframe da casca a
sessão chega por `postMessage` e o token nunca é guardado. Menu, cabeçalho, busca global e
notificações são da casca: o módulo desenha só o conteúdo de cada tela, então no modo direto
troca-se de tela pela URL (`/empresas`, `/contatos`, `/funil`, `/oportunidades`, `/prospeccao`).
Para outro endereço de gateway, use `VITE_GATEWAY` no `.env.local`.

| Tela | Rotas da API |
|---|---|
| Empresas | `/empresas`, `/empresas/{id}`, `/empresas/{id}/unidades`; status em lote no Financeiro, Contratos e Chamados |
| Contatos | `/empresas/{id}/contatos`, `/contatos`, `/contatos/{id}` |
| Funil de Vendas | `/funis` e `/funis/{id}` (criar, renomear, padrão, excluir), `/funis/{id}/etapas`, `/funis/{id}/etapas/ordem`, `/etapas/{id}`, `/oportunidades/{id}/mover` |
| Oportunidades | `/oportunidades`, `/{id}`, `/ganhar`, `/perder`; dentro dela, `/atividades`, `/tarefas` (criar, editar, concluir, excluir), `/reunioes` (agendar, reagendar, cancelar, `/registro`) e `/objecoes` (com `/objecoes/frequentes` como sugestão) |
| Prospecção | `/prospeccao`, `/empresas/{id}/tentativas`, `/tentativas/{id}` (excluir), `/empresas/{id}/converter` |

As ações aparecem conforme o claim `perms` do token (esconder é usabilidade; o back-end continua
respondendo 403). Nomes de vendedor e responsável vêm do identity: `/usuarios` para quem tem
`identity.usuario.ver`, os membros das próprias equipes para os demais.

| Pasta | O que tem |
|---|---|
| `src/modulos/{dominio}/` | `*.types.ts`, `*.service.ts`, `use-*.ts`, `*-page.tsx`, `*.routes.tsx` e `components/` |
| `src/model/` | Contrato da API, espelho dos records Java |
| `src/components/ui/` | Componentes do design system, copiados da casca |
| `src/desenvolvimento/` | Login de teste do modo direto (Contrato §12) |

**Ainda sem rota no back-end, por isso fora da tela:** busca por texto e filtro de porte na
lista de empresas, busca por texto em oportunidades e prospecção, listagem geral de contatos
(a tela lista por empresa) e importação de planilha.

## Testes

Precisa de Java 21, Maven e Docker (o Testcontainers sobe um PostgreSQL temporário):

```bash
cd api
mvn verify
```

Cobrem autenticação e permissões (401 e 403), isolamento entre tenants, token de serviço,
duplicidade de empresa e contato, funis e etapas, o ciclo de vida da oportunidade, a publicação
dos eventos, a busca global, e atividades, tarefas, reuniões e objeções.

## Equipe

| Integrante | Papel |
|---|---|
| Adison de Oliveira Gontijo Magalhães | Gerente de projeto, back-end e DevOps |
| Helwi Salman Bahmad | Análise e documentação |
| Rafaela Almeida de Lacerda | UX/UI, prototipação e apoio ao back-end |
| Arthur Santos Lacerda | QA e testes |
| Matteo Souza Caetano | QA e testes |
