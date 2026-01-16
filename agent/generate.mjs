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

// Importa seu render-template.js CommonJS
const require = createRequire(import.meta.url);
const { renderTemplate } = require("./render-template.js");

/**
 * Config por env (para você não hardcodar caminhos)
 */
function getConfig() {
  const cfg = {
    // Templates principais
    plannerTemplate: process.env.PLANNER_TEMPLATE || "prompts/planner.md",
    entityTemplate: process.env.ENTITY_TEMPLATE || "prompts/gerar_entidade.md",
    layoutTemplate: process.env.LAYOUT_TEMPLATE || "prompts/gerar_layout.md",

    // Schema do planner (structured outputs)
    plannerSchemaPath: process.env.PLANNER_SCHEMA || "schemas/planner.schema.json",

    // Includes do gerador de entidades
    entityIncludes: {
      json_schema: process.env.ENTITY_JSON_SCHEMA || "schemas/entity.schema.json",
      field_types_definitions:
        process.env.ENTITY_FIELD_TYPES_DEFINITIONS || "prompts/includes/definicoes_campos.md",
      filters_definitions:
        process.env.ENTITY_FILTERS_DEFINITIONS || "prompts/includes/definicoes_filtros.md",
      entity_examples: process.env.ENTITY_EXAMPLES || "prompts/includes/exemplos_entidades.md",
      // spec será preenchido dinamicamente
    },

    // Includes do gerador de layouts
    layoutIncludes: {
      layout_json_schema: process.env.LAYOUT_JSON_SCHEMA || "schemas/layout.schema.json",
      layout_component_definitions:
        process.env.LAYOUT_COMPONENT_DEFINITIONS || "prompts/includes/definicoes_componentes_layout.md",
      layout_examples: process.env.LAYOUT_EXAMPLES || "prompts/includes/exemplos_layout.md",
      // spec será preenchido dinamicamente
    },

    // Root dir para resolver includes sem ./ ou ../
    rootDir: process.env.TEMPLATE_ROOT_DIR || process.cwd(),

    // Saídas
    outDir: process.env.GENERATED_DIR || "generated",
  };

  return cfg;
}

async function ensureFileExists(p) {
  if (!fssync.existsSync(p)) {
    throw new Error(`Arquivo não encontrado: ${p}`);
  }
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

function buildLayoutBindingSpec(layoutPlan, fallbackScope) {
  const kind = layoutPlan.kind || "list";
  const escopo = layoutPlan.escopo || fallbackScope || "geral";
  const codigo = layoutPlan.codigo || "screen";

  const refs = Array.isArray(layoutPlan.entity_refs) ? layoutPlan.entity_refs : [];
  const mainRef = refs.find((r) => r.main) || refs[0];

  // Defaults defensivos (caso o planner deixe algo faltando)
  const defaultCardinality = kind === "list" ? "many" : "one";
  const defaultLoad = kind === "list";

  const normalizedRefs = refs.map((r, idx) => ({
    alias: r.alias,
    schema: r.schema,
    cardinality: r.cardinality || defaultCardinality,
    load: typeof r.load === "boolean" ? r.load : defaultLoad,
    main: typeof r.main === "boolean" ? r.main : idx === 0,
  }));

  // Instruções curtas e explícitas para o gerador de layout
  return (
    `\n\n---\n` +
    `CONTRATO DETERMINÍSTICO (NÃO IGNORAR)\n` +
    `- Tela (kind): ${kind}\n` +
    `- Escopo do layout: ${escopo}\n` +
    `- Código do layout: ${codigo}\n` +
    `- Transaction.name sugerido: ${codigo}\n` +
    `- Bindings obrigatórios (json_schema.transaction.entities):\n` +
    normalizedRefs
      .map((r) => {
        return (
          `  - alias: ${r.alias}\n` +
          `    schema: ${r.schema}\n` +
          `    cardinality: ${r.cardinality}\n` +
          `    load: ${r.load}\n` +
          `    main: ${r.main}\n`
        );
      })
      .join("") +
    `\nRegras:\n` +
    `- Use exatamente os aliases acima como dataRef.\n` +
    `- Para listagem (kind=list): use GenericGrid com dataRef do alias principal (${mainRef?.alias || "main"}).\n` +
    `- Para edição (kind=edit): use GenericForm (Field apenas dentro dele) com dataRef do alias principal.\n` +
    `- Para detalhe (kind=detail): use ItensList com dataRef "<alias>.selected" do alias principal.\n` +
    `---\n`
  );
}


async function main() {
  const cfg = getConfig();

  // Entrada do PO
  const userSpec = process.argv.slice(2).join(" ").trim();
  if (!userSpec) {
    console.error('Uso: node generate.mjs "<especificacao do PO>"');
    process.exit(1);
  }

  // Checagens mínimas (para falhar cedo)
  await ensureFileExists(cfg.plannerTemplate);
  await ensureFileExists(cfg.entityTemplate);
  await ensureFileExists(cfg.layoutTemplate);
  await ensureFileExists(cfg.plannerSchemaPath);

  // tmp para tokens dinâmicos
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "erprompt-poc-"));

  try {
    // ===== 1) COMPILA PROMPT DO PLANNER =====
    // Tokens que o planner template deve usar:
    // - @include $user_spec
    // - opcional: @include $default_scope (se você quiser)
    const userSpecPath = await writeTempFile(tmpDir, "user_spec.md", userSpec);

    // Default scope: regra sua = inferir; se não der, "geral"
    //const defaultScopePath = await writeTempFile(tmpDir, "default_scope.txt", "geral");

    const plannerPrompt = compileTemplate(
      cfg.plannerTemplate,
      {
        user_spec: userSpecPath,
        //default_scope: defaultScopePath
      },
      cfg.rootDir
    );

    // ===== 2) CHAMA PLANNER (STRUCTURED OUTPUTS) =====
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

    // ===== 3) GERA ENTIDADES =====
    // plan.entities: [{ escopo, codigo, descricao, spec_markdown }]
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

    // ===== 4) GERA LAYOUTS =====
    // Para cada layout, anexar JSON das entidades referenciadas no final do spec.
    for (const lay of plan.layouts || []) {
      const escopo = lay.escopo || plan.escopo_padrao || "geral";
      const codigo = lay.codigo;
      const specBase = lay.spec_markdown || "";

      if (!codigo) {
        console.warn("Layout ignorado por faltar codigo:", lay);
        continue;
      }

      let specFinal = specBase;
      // Injeta um bloco determinístico com kind + bindings
      //specFinal += buildLayoutBindingSpec(lay, plan.escopo_padrao || "geral");

      // Anexa JSONs das entidades referenciadas
      const refs = Array.isArray(lay.entity_refs) ? lay.entity_refs : [];
      for (const ref of refs) {
        const schemaRef = ref.schema; // "<escopo>/<Codigo>"
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
    // Limpa tmp
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("Falha no generate:", err?.message || err);
  process.exit(1);
});
