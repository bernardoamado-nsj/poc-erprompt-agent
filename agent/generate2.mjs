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

const require = createRequire(import.meta.url);
const { renderTemplate } = require("./render-template.cjs");

import { fileURLToPath } from "node:url";

function getConfig() {
  // Base directory = pasta onde este arquivo .mjs está (ex.: .../agent)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Helper: resolve paths relative to agent dir unless absolute or explicitly relative to CWD.
  const resolveFromAgentDir = (p) => {
    if (!p) return p;
    // If absolute, keep as-is
    if (path.isAbsolute(p)) return p;
    // Otherwise resolve relative to the script directory (agent/)
    return path.resolve(__dirname, p);
  };

  const rootDir = resolveFromAgentDir(process.env.TEMPLATE_ROOT_DIR || "."); // agent/
  const outDir = process.env.GENERATED_DIR
    ? (path.isAbsolute(process.env.GENERATED_DIR)
        ? process.env.GENERATED_DIR
        : path.resolve(process.cwd(), process.env.GENERATED_DIR)) // outDir: normalmente relativo ao CWD do comando
    : path.resolve(process.cwd(), "generated");

  return {
    plannerTemplate: resolveFromAgentDir(
      process.env.PLANNER_TEMPLATE || "prompts/planner/gerar_planner5.md"
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

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "erprompt-poc-"));

  try {
    // ===== 1) Build user_spec and user_answers includes =====
    const userSpecPath = await writeTempFile(tmpDir, "user_spec.md", userSpec);

    let answersMd = "";
    if (answersPath) {
      const answersText = await fs.readFile(answersPath, "utf8");
      const answersObj = JSON.parse(answersText);
      answersMd = answersToMarkdown(answersObj);
    }
    const userAnswersPath = await writeTempFile(tmpDir, "user_answers.md", answersMd);

    // ===== 2) Compile planner prompt =====
    const plannerPrompt = compileTemplate(
      cfg.plannerTemplate,
      { user_spec: userSpecPath, user_answers: userAnswersPath },
      cfg.rootDir
    );

    // ===== 3) Call planner (Structured Outputs) =====
    const plannerSchema = JSON.parse(await fs.readFile(cfg.plannerSchemaPath, "utf8"));

    const plannerOutPath = path.join(cfg.outDir, "planner.json");
    const plannerResult = await callOpenAIPlannerStructured({
      promptText: plannerPrompt,
      plannerSchema,
      outPath: plannerOutPath,
    });

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
      await fs.mkdir(cfg.outDir, { recursive: true }).catch(() => {});
      const questionsOut = path.join(cfg.outDir, "questions.json");

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
      process.exit(3);
    }

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

      const outPath = entityPath(cfg.outDir, escopo, codigo);
      const res = await callOpenAISaveJsonObject({ promptText: entityPrompt, outPath });

      if (!res.ok) {
        console.error(res.error);
        process.exit(2);
      }

      console.log(`OK: entidade gerada ${escopo}/${codigo} -> ${outPath}`);
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
        const entFile = entityPath(cfg.outDir, refScope || "geral", refCode);
        const entJsonText = await fs.readFile(entFile, "utf8");
        specFinal += buildEntityRefBlock(schemaRef, entJsonText);
      }

      const specPath = await writeTempFile(tmpDir, `spec_layout_${escopo}_${codigo}.md`, specFinal);

      const layoutPrompt = compileTemplate(
        cfg.layoutTemplate,
        { ...cfg.layoutIncludes, spec: specPath },
        cfg.rootDir
      );

      const outPath = layoutPath(cfg.outDir, escopo, codigo);
      const res = await callOpenAISaveJsonObject({ promptText: layoutPrompt, outPath });

      if (!res.ok) {
        console.error(res.error);
        process.exit(2);
      }

      console.log(`OK: layout gerado ${escopo}/${codigo} -> ${outPath}`);
    }

    console.log(`\nConcluído. Saídas em: ${cfg.outDir}`);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("Falha no generate:", err?.message || err);
  process.exit(1);
});
