// generate.mjs
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { createRequire } from "node:module";

import "dotenv/config";

import { callOpenAIPlannerStructured } from "./call-openai-planner.mjs";
import { callOpenAISaveJsonObject } from "./call-openai-save2.mjs";
import { callOpenAIMockJsonObject } from "./call-openai-mock2.mjs";



const require = createRequire(import.meta.url);
const { renderTemplate } = require("./render-template.cjs");

import { fileURLToPath } from "node:url";

// Base directory = pasta onde este arquivo .mjs está (ex.: .../agent)
const _FILENAME = fileURLToPath(import.meta.url);
const _DIRNAME = path.dirname(_FILENAME);

const PROJECT_ROOT_DIR = path.join(_DIRNAME, '..');
const AGENT_DIR = _DIRNAME;
const SERVER_DIR = path.join(PROJECT_ROOT_DIR, 'server');

function getConfig() {
  

  // Helper: resolve paths relative to agent dir unless absolute or explicitly relative to CWD.
  const resolveFromAgentDir = (p) => {
    if (!p) return p;
    // If absolute, keep as-is
    if (path.isAbsolute(p)) return p;
    // Otherwise resolve relative to the script directory (agent/)
    return path.resolve(_DIRNAME, p);
  };

  const rootDir = resolveFromAgentDir(process.env.TEMPLATE_ROOT_DIR || "."); // agent/
  const outDir = process.env.GENERATED_DIR
    ? (path.isAbsolute(process.env.GENERATED_DIR)
        ? process.env.GENERATED_DIR
        : path.resolve(process.cwd(), process.env.GENERATED_DIR)) // outDir: normalmente relativo ao CWD do comando
    : path.resolve(process.cwd(), "generated");

  return {
    plannerTemplate: resolveFromAgentDir(
      process.env.PLANNER_TEMPLATE || "prompts/planner/gerar_planner7.md"
    ),
    entityTemplate: resolveFromAgentDir(
      process.env.ENTITY_TEMPLATE || "prompts/entity/gerar_entidade_full_agent_prompt.md"
    ),
    layoutTemplate: resolveFromAgentDir(
      process.env.LAYOUT_TEMPLATE || "prompts/layout/gerar_layout_full_agent_prompt.md"
    ),
    plannerSchemaPath: resolveFromAgentDir(
      process.env.PLANNER_SCHEMA || "schemas/planner.schema.json"
    ),
    mockSchemaPath: resolveFromAgentDir(
      process.env.MOCK_SCHEMA || "schemas/mock.schema.json"
    ),

    entityIncludes: {
      json_schema: resolveFromAgentDir(
        process.env.ENTITY_JSON_SCHEMA || "schemas/entity.schema.json"
      ),
      field_types_definitions: resolveFromAgentDir(
        process.env.ENTITY_FIELD_TYPES_DEFINITIONS ||
          "prompts/includes/definicoes_campos_entidades.md"
      ),
      filters_definitions: resolveFromAgentDir(
        process.env.ENTITY_FILTERS_DEFINITIONS ||
          "prompts/includes/definicoes_filtros_entidades.md"
      ),
      entity_examples: resolveFromAgentDir(
        process.env.ENTITY_EXAMPLES ||
          "prompts/includes/exemplos_canonicos_entidades.md"
      )
    },

    layoutIncludes: {
      layout_json_schema: resolveFromAgentDir(
        process.env.LAYOUT_JSON_SCHEMA || "schemas/layout.schema.json"
      ),
      layout_component_definitions: resolveFromAgentDir(
        process.env.LAYOUT_COMPONENT_DEFINITIONS ||
          "prompts/includes/definicoes_componentes.md"
      ),
      layout_examples: resolveFromAgentDir(
        process.env.LAYOUT_EXAMPLES ||
          "prompts/includes/exemplos_canonicos_layouts.md"
      )
    },

    // rootDir deve apontar para o "agent/" para o seu render-template resolver includes corretamente
    rootDir,

    // outDir: eu recomendo relativo ao local onde você executa o comando (CWD),
    // assim você controla a saída por projeto/workdir
    outDir
  };
}

async function ensureFileExists(p) {
  if (!fssync.existsSync(p)) throw new Error(`Arquivo não encontrado: ${p}`);
}

function makeRunId() {
  // Ex.: 2026-01-19T14-33-10-123Z
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}


function sanitizeFileName(s) {
  return String(s).replace(/[^\w.\-]+/g, "_");
}

async function writeTempFile(tmpDir, name, content) {
  const fp = path.join(tmpDir, sanitizeFileName(name));
  await fs.writeFile(fp, content, "utf8");
  return fp;
}

function compileTemplate(templatePath, includes, rootDir) {
  return renderTemplate(templatePath, {
    rootDir,
    includes,
    strict: true,
    maxDepth: 50,
    encoding: "utf-8",
  });
}

function entityPath(outDir, escopo, codigo) {
  return path.join(outDir, "entities", escopo, `${codigo}.json`);
}

function layoutPath(outDir, escopo, codigo) {
  return path.join(outDir, "layouts", escopo, `${codigo}.json`);
}

async function readJsonIfExists(p) {
  try {
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function buildEntityRefBlock(schemaRef, entityJsonText) {
  return (
    `\n\nEste é o JSON da entidade ${schemaRef}:\n` +
    "```json\n" +
    entityJsonText.trim() +
    "\n```\n"
  );
}

/**
 * CLI parsing:
 *   node generate.mjs "<user spec>" [--answers path/to/answers.json]
 */
function parseCli(argv) {
  const args = [...argv];
  let answersPath = null;

  const specParts = [];
  while (args.length) {
    const a = args.shift();
    if (a === "--answers") {
      answersPath = args.shift() || null;
      continue;
    }
    specParts.push(a);
  }

  return { userSpec: specParts.join(" ").trim(), answersPath };
}

/**
 * Turns answers.json into markdown injected into planner prompt.
 * Supported formats:
 *  A) { "answers": [ { "question": "...", "answer": "..." } ] }
 *  B) { "question1": "answer1", "question2": "answer2" }  (object map)
 */
function answersToMarkdown(answersObj) {
  if (!answersObj) return "";

  if (Array.isArray(answersObj.answers)) {
    const lines = answersObj.answers
      .filter((x) => x && x.question && typeof x.answer === "string")
      .map((x) => `- Q: ${x.question}\n  A: ${x.answer}`);
    return lines.length ? lines.join("\n") + "\n" : "";
  }

  if (typeof answersObj === "object") {
    const entries = Object.entries(answersObj)
      .filter(([k, v]) => typeof v === "string")
      .map(([k, v]) => `- Q: ${k}\n  A: ${v}`);
    return entries.length ? entries.join("\n") + "\n" : "";
  }

  return "";
}

// --- utils to measure time ---

function nowMs() {
  return Number(process.hrtime.bigint()) / 1_000_000; // ms (alta resolução)
}

async function timed(label, fn) {
  const t0 = nowMs();
  try {
    const result = await fn();
    const t1 = nowMs();
    return { ok: true, label, ms: Math.round(t1 - t0), result };
  } catch (err) {
    const t1 = nowMs();
    return { ok: false, label, ms: Math.round(t1 - t0), error: err };
  }
}

function msToHuman(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function persistMetrics(outDir, metrics) {
  await fs.mkdir(outDir, { recursive: true }).catch(() => {});
  const fp = path.join(outDir, "metrics.json");
  await fs.writeFile(fp, JSON.stringify(metrics, null, 2), "utf8");
  return fp;
}

// -----------------------------

async function writeLatestPointer(baseOutDir, runId) {
  await ensureDir(baseOutDir);
  const fp = path.join(baseOutDir, "latest.json");
  await fs.writeFile(fp, JSON.stringify({ runId, runPath: path.join("runs", runId) }, null, 2), "utf8");
}

function kebabCase(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function defaultResourceFromEntityCode(codigo) {
  const base = kebabCase(codigo);
  return base.endsWith("s") ? base : `${base}s`;
}

function parseEndpointResource(endpointUrl) {
  // endpoint: http://localhost:4000/notas -> resource: "notas"
  try {
    const u = new URL(endpointUrl);
    return u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  } catch {
    // se vier "notas" direto
    return String(endpointUrl).replace(/^\/+/, "").replace(/\/+$/, "");
  }
}

function runDirFromEnv(cfg) {
  const runId = process.env.RUN_ID || "run_local";
  // seu generate novo já salva em runs/<timestamp>; adapte aqui conforme seu padrão:
  // assumindo: cfg.outDir aponta para ".../generated" (pasta base)
  return path.join(cfg.outDir, "runs", runId);
}

function mockOutPath(runDir, escopo, codigo) {
  return path.join(runDir, "mocks", escopo, `${codigo}.mock.json`);
}

// ------------------ generator functions --------------------- //
async function generateMockData({runDir, mockSchema, escopo, codigo, entityJsonPath}) {
  await fs.mkdir(runDir, { recursive: true }).catch(() => {});

  // Descobrir resource via endpoints (se já existir), senão default
  let resource = defaultResourceFromEntityCode(codigo);
  try {
    // lê db.json para ver se já existe endpoint registrado (opcional)
    const dbTxt = await fs.readFile(path.join(SERVER_DIR, "db.json"), "utf8");
    const dbObj = JSON.parse(dbTxt);
    const endpoints = Array.isArray(dbObj.endpoints) ? dbObj.endpoints : [];
    const schemaId = `${escopo}/${codigo}`;
    const found = endpoints.find((e) => e && (e.schema === schemaId || e.id === `${escopo}.${codigo}`));
    if (found?.endpoint) resource = parseEndpointResource(found.endpoint);
  } catch {
    // ignore
  }

  const schemaId = `${escopo}/${codigo}`;
  const entityJsonText = await fs.readFile(entityJsonPath, "utf8");

  // prompt inline do mock generator
  const mockPrompt =
    `Você é um gerador de dados MOCK para json-server.\n` +
    `Gere um dataset de ${20} registros para a entidade ${schemaId}.\n\n` +
    `REGRAS:\n` +
    `- Saída deve ser APENAS JSON válido no formato exigido.\n` +
    `- "schema" deve ser "${schemaId}".\n` +
    `- "resource" deve ser "${resource}".\n` +
    `- "count" deve ser ${20}.\n` +
    `- Gere "items" com exatamente ${20} objetos.\n` +
    `- Respeite json_schema.required e tipos em json_schema.properties.\n` +
    `- Para fields com format "uuid": gere UUID v4.\n` +
    `- Para format "date": use YYYY-MM-DD.\n` +
    `- Para format "currency": use string numérica tipo "123.45".\n` +
    `- Se a entidade tiver filters.fields.<campo>.values (enum), use valores desse enum.\n` +
    `- Não invente campos fora do schema. Prefira campos definidos em properties.\n\n` +
    `AQUI ESTÁ O JSON DA ENTIDADE:\n` +
    "```json\n" + entityJsonText.trim() + "\n```\n";

  const mockPath = mockOutPath(runDir, escopo, codigo);

  const mockRes = await callOpenAIMockJsonObject({ promptText: mockPrompt, outPath: mockPath });


  if (!mockRes.ok) {
    console.error("Falha ao gerar mock:", mockRes.error);
    process.exit(2);
  }

  console.log(`OK: mock gerado ${schemaId} -> ${mockPath}`);
}

// ------------------------------------------------------------ //

async function main() {
  const cfg = getConfig();
  const { userSpec, answersPath } = parseCli(process.argv.slice(2));

  if (!userSpec) {
    console.error('Uso: node generate.mjs "<especificacao do PO>" [--answers answers.json]');
    process.exit(1);
  }

  await ensureFileExists(cfg.plannerTemplate);
  await ensureFileExists(cfg.entityTemplate);
  await ensureFileExists(cfg.layoutTemplate);
  await ensureFileExists(cfg.plannerSchemaPath);
  await ensureFileExists(cfg.mockSchemaPath);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "erprompt-poc-"));

  const runId = process.env.RUN_ID || makeRunId();

  // Pasta base: cfg.outDir (ex.: <CWD>/generated)
  // Pasta do run: <outDir>/runs/<runId>
  const runDir = path.join(cfg.outDir, "runs", runId);
  await ensureDir(runDir);
  await ensureDir(path.join(runDir, "entities"));
  await ensureDir(path.join(runDir, "layouts"));

  const metrics = {
    runId,
    startedAt: new Date().toISOString(),
    cwd: process.cwd(),
    outDir: runDir,
    durationsMs: {
      total: 0,
      planner: 0
    },
    entities: [], // { escopo, codigo, ms, ok, outPath }
    layouts: [],  // { escopo, codigo, ms, ok, outPath }
    gating: {
      blocked: false,
      blockingCount: 0,
      questionsOut: null
    }
  };

  const runStart = nowMs();


  try {
    // ===== 1) Build user_spec and user_answers includes =====
    const userSpecPath = await writeTempFile(tmpDir, "user_spec.md", userSpec);

    await fs.writeFile(path.join(runDir, "user_spec.txt"), userSpec, "utf8");

    let answersMd = "";
    if (answersPath) {
      const answersText = await fs.readFile(answersPath, "utf8");
      const answersObj = JSON.parse(answersText);
      answersMd = answersToMarkdown(answersObj);
    }
    const userAnswersPath = await writeTempFile(tmpDir, "user_answers.md", answersMd);
    if (answersPath) {
      await fs.copyFile(answersPath, path.join(runDir, "answers.json")).catch(() => {});
    }

    // ===== 2) Compile planner prompt =====
    const plannerPrompt = compileTemplate(
      cfg.plannerTemplate,
      { user_spec: userSpecPath, user_answers: userAnswersPath },
      cfg.rootDir
    );
    await fs.writeFile(path.join(runDir, "planner_prompt_compiled.md"), plannerPrompt, "utf8");


    // ===== 3) Call planner (Structured Outputs) =====
    const plannerSchema = JSON.parse(await fs.readFile(cfg.plannerSchemaPath, "utf8"));

    const plannerOutPath = path.join(runDir, "planner.json");

    const plannerTimed = await timed("planner", async () => {
      return callOpenAIPlannerStructured({
        promptText: plannerPrompt,
        plannerSchema,
        outPath: plannerOutPath,
      });
    });

    metrics.durationsMs.planner = plannerTimed.ms;
    console.log(`Tempo planner: ${msToHuman(plannerTimed.ms)}`);

    if (!plannerTimed.ok) {
      console.error("Falha no planner:", plannerTimed.error?.message || plannerTimed.error);
      process.exit(2);
    }

    const plannerResult = plannerTimed.result;
    if (!plannerResult.ok) {
      console.error(plannerResult.error);
      process.exit(2);
    }

    const plan = await readJsonIfExists(plannerOutPath);
    if (!plan) {
      console.error("Planner retornou JSON inválido (não deveria acontecer com strict schema).");
      process.exit(2);
    }

    // ===== 4) Gating: blocking questions =====
    const openQuestions = plan?.decisoes?.open_questions || [];
    const blocking = openQuestions.filter((q) => q && q.blocking === true);

    if (blocking.length) {
      //await fs.mkdir(runDir, { recursive: true }).catch(() => {});
      const questionsOut = path.join(runDir, "questions.json");

      const payload = {
        escopo_padrao: plan.escopo_padrao,
        assumptions: plan?.decisoes?.assumptions || [],
        open_questions: openQuestions,
        instructions:
          "Responda as perguntas bloqueantes e salve um answers.json. Depois rode novamente: node generate.mjs \"<spec>\" --answers <answers.json>",
        answers_format_examples: [
          {
            answers: blocking.map((q) => ({
              question: q.question,
              answer: ""
            }))
          }
        ]
      };

      await fs.writeFile(questionsOut, JSON.stringify(payload, null, 2), "utf8");
      console.error(
        `Geração interrompida: existem ${blocking.length} perguntas bloqueantes.\n` +
          `Arquivo gerado para interação com o usuário: ${questionsOut}`
      );

      metrics.gating.blocked = true;
      metrics.gating.blockingCount = blocking.length;
      metrics.gating.questionsOut = questionsOut;

      metrics.durationsMs.total = Math.round(nowMs() - runStart);
      metrics.endedAt = new Date().toISOString();
      await persistMetrics(runDir, metrics);
      await writeLatestPointer(cfg.outDir, runId);

      process.exit(3);
    }

    const mockSchema = JSON.parse(await fs.readFile(cfg.mockSchemaPath, "utf8"));

    // ===== 5) Generate entities =====
    for (const ent of plan.entities || []) {
      const escopo = ent.escopo || plan.escopo_padrao || "geral";
      const codigo = ent.codigo;
      const spec = ent.spec_markdown;

      if (!codigo || !spec) {
        console.warn("Entidade ignorada por faltar codigo/spec_markdown:", ent);
        continue;
      }

      const specPath = await writeTempFile(tmpDir, `spec_entity_${escopo}_${codigo}.md`, spec);

      const entityPrompt = compileTemplate(
        cfg.entityTemplate,
        { ...cfg.entityIncludes, spec: specPath },
        cfg.rootDir
      );

      const outPath = entityPath(runDir, escopo, codigo);
      //const res = await callOpenAISaveJsonObject({ promptText: entityPrompt, outPath });

      const entTimed = await timed(`entity:${escopo}/${codigo}`, async () => {
        return callOpenAISaveJsonObject({ promptText: entityPrompt, outPath });
      });

      metrics.entities.push({
        escopo,
        codigo,
        ms: entTimed.ms,
        ok: entTimed.ok && entTimed.result?.ok === true,
        outPath
      });

      console.log(`Tempo entidade ${escopo}/${codigo}: ${msToHuman(entTimed.ms)}`);

      if (!entTimed.ok) {
        console.error("Falha ao gerar entidade:", entTimed.error?.message || entTimed.error);
        process.exit(2);
      }

      const res = entTimed.result;
      if (!res.ok) {
        console.error(res.error);
        process.exit(2);
      }

      console.log(`OK: entidade gerada ${escopo}/${codigo} -> ${outPath}`);

      // ===== 5.1) Generate mocks for this entity =====
      generateMockData({
        codigo,
        escopo,
        entityJsonPath: outPath,
        mockSchema,
        runDir
      });
    }

    // ===== 6) Generate layouts =====
    for (const lay of plan.layouts || []) {
      const escopo = lay.escopo || plan.escopo_padrao || "geral";
      const codigo = lay.codigo;
      const specBase = lay.spec_markdown || "";

      if (!codigo) {
        console.warn("Layout ignorado por faltar codigo:", lay);
        continue;
      }

      let specFinal = specBase;

      // Append referenced entity JSONs
      const refs = Array.isArray(lay.entity_refs) ? lay.entity_refs : [];
      for (const ref of refs) {
        const schemaRef = ref.schema;
        if (!schemaRef || !schemaRef.includes("/")) continue;

        const [refScope, refCode] = schemaRef.split("/", 2);
        const entFile = entityPath(runDir, refScope || "geral", refCode);
        const entJsonText = await fs.readFile(entFile, "utf8");
        specFinal += buildEntityRefBlock(schemaRef, entJsonText);
      }

      const specPath = await writeTempFile(tmpDir, `spec_layout_${escopo}_${codigo}.md`, specFinal);

      const layoutPrompt = compileTemplate(
        cfg.layoutTemplate,
        { ...cfg.layoutIncludes, spec: specPath },
        cfg.rootDir
      );

      const outPath = layoutPath(runDir, escopo, codigo);

      const layTimed = await timed(`layout:${escopo}/${codigo}`, async () => {
        return callOpenAISaveJsonObject({ promptText: layoutPrompt, outPath });
      });

      metrics.layouts.push({
        escopo,
        codigo,
        ms: layTimed.ms,
        ok: layTimed.ok && layTimed.result?.ok === true,
        outPath
      });

      console.log(`Tempo layout ${escopo}/${codigo}: ${msToHuman(layTimed.ms)}`);

      if (!layTimed.ok) {
        console.error("Falha ao gerar layout:", layTimed.error?.message || layTimed.error);
        process.exit(2);
      }

      const res = layTimed.result;
      if (!res.ok) {
        console.error(res.error);
        process.exit(2);
      }

      console.log(`OK: layout gerado ${escopo}/${codigo} -> ${outPath}`);
    }

    metrics.durationsMs.total = Math.round(nowMs() - runStart);
    metrics.endedAt = new Date().toISOString();

    const metricsPath = await persistMetrics(runDir, metrics);
    console.log(`Metrics salvas em: ${metricsPath}`);
    console.log(`Tempo total: ${msToHuman(metrics.durationsMs.total)}`);

    await writeLatestPointer(cfg.outDir, runId);

    console.log(`\nConcluído. Saídas em: ${runDir}`);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("Falha no generate:", err?.message || err);
  process.exit(1);
});
