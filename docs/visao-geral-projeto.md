# POC ERPrompt Agent — Visão Geral

Este documento resume o que o projeto é, como funciona e como rodar localmente.

## Visão Geral

- POC para gerar telas dinâmicas com IA: planner → entidades → layouts → mocks.
- Frontend React/Vite renderiza páginas via `@nasajon/erprompt-lib` com layouts em JSON.
- Backend `json-server` (porta 4000) expõe coleções e rotas extras para disparar o “agent” (Node) e versionar saídas em `server/db.json`.

## Arquitetura

- Frontend (`src/`)
  - `src/App.tsx`: registra dinamicamente `EntityApi` usando `GET /endpoints`; usa `DynamicMenu` e `AppRouter`.
  - `src/components/Telas.tsx`: interface para listar telas geradas e enviar prompt de geração; renderiza `DynamicPage` selecionada.
  - `@nasajon/erprompt-lib`: carrega layout por `layoutId` (`escopo.codigo`) e orquestra busca de dados via `EntityApi`.

- Backend (`server/`)
  - `server/server.cjs`: sobe `json-server`, aplica middlewares e pluga rotas de IA.
  - `server/ai-runs.cjs`: rotas para executar o agente, acompanhar status e consolidar saídas no `db.json`.
  - Coleções em `server/db.json`: `generated-pages`, `layouts-schemas`, `entities-schemas`, `endpoints` e datasets (ex.: `/notas`).

- Agent (`agent/`)
  - `agent/generate.mjs`: pipeline de geração (planner → entidades → mocks → layouts), grava em `generated/runs/<runId>`.
  - Chama OpenAI via `agent/call-openai-*.mjs` com prompts compilados de `agent/prompts/*`.
  - Ao finalizar com sucesso, o backend faz “commit” no `server/db.json` (upsert) para páginas, schemas e endpoints.

## Fluxo (resumo)

1) Frontend carrega dados iniciais:
   - Menu: `GET /launcher-itens` (usado por `@nasajon/erprompt-launcher-lib`).
   - Endpoints: `GET /endpoints` → registra `EntityApi(schema → endpoint)` no `erprompt-lib`.
   - Telas geradas: `GET /generated-pages` → alimenta o dropdown em “Telas”.

2) Renderização de tela:
   - Usuário seleciona uma página; `DynamicPage` é renderizado com `layoutId = escopo.codigo`.
   - `erprompt-lib` busca `GET /layouts-schemas/:id` e, ao ler `transaction.entities[].schema`, usa `EntityApi` correspondente para obter dados dos datasets.

3) Geração com IA:
   - Usuário envia um prompt em “Gerar nova”.
   - `POST /ai/runs` dispara `agent/generate.mjs`, que grava em `generated/runs/<runId>/...` e retorna `statusUrl`.
   - Polling de `GET /ai/runs/:runId/status` até `done`. Ao concluir, o backend upserta em `server/db.json`:
     - `generated-pages`, `layouts-schemas`, `entities-schemas`, `endpoints`, e datasets (ex.: `notas`).

## Como Rodar

1) Variáveis de ambiente
   - Crie `.env` na raiz baseado em `.env.dist`.
   - Para geração com IA, defina `OPENAI_API_KEY`.
   - Variáveis úteis no FE: `VITE_ERPROMPT_API_URL`, `VITE_KEYCLOAK_*`, etc.

2) Backend (porta 4000)
   - `pnpm serve` ou `npm run serve`

3) Frontend (porta 5199)
   - `pnpm dev` ou `npm run dev`
   - Acesse `http://localhost:5199` (base do app: `/erprompt-agent`).

## Rotas Principais (server)

- Coleções do `json-server`:
  - `GET /launcher-itens`
  - `GET /generated-pages`
  - `GET /layouts-schemas` e `GET /layouts-schemas/:id`
  - `GET /entities-schemas` e `GET /entities-schemas/:id`
  - `GET /endpoints`
  - Datasets: ex.: `GET /notas`, `GET /pedido-vendas`, etc.

- Rotas de IA:
  - `POST /ai/runs` → inicia geração a partir de um `spec` (prompt do usuário).
  - `GET /ai/runs/:runId/status` → status do run (arquivo `generated/runs/<runId>/status.json`).
  - `GET /generated-pages/:id/layout` → lê layout JSON associado ao `runId` gravado.

## Pontos de Atenção

- URLs no frontend: `erprompt-lib` usa `VITE_ERPROMPT_API_URL` (fallback `http://localhost:4000`), mas `App.tsx`/`Telas.tsx` usam explicitamente `http://localhost:4000` como padrão.
- Autenticação: `EntityApi` envia Bearer (Keycloak). O `json-server` ignora, mas é necessário para compatibilidade com libs do ecossistema.
- Saídas da IA ficam em `generated/runs/<runId>`; os commits no `db.json` tornam as novas telas disponíveis em `/generated-pages`.

## Referências de Código

- Frontend: `src/App.tsx`, `src/components/Telas.tsx`, `src/router/AppRouter.tsx`
- Backend: `server/server.cjs`, `server/ai-runs.cjs`, `server/db.json`
- Agent: `agent/generate.mjs`, `agent/prompts/*`, `agent/call-openai-*.mjs`

