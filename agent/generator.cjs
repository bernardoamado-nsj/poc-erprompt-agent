const path = require("path");
const fs = require("fs/promises");
const { pathToFileURL } = require("url");

const { renderTemplate } = require("./render-template.cjs");

const agentDir = __dirname;

let generateJsonFromPromptCached;
async function getGenerateJsonFromPrompt() {
  if (generateJsonFromPromptCached) return generateJsonFromPromptCached;
  const mod = await import(pathToFileURL(path.join(agentDir, "openai-client.mjs")).href);
  generateJsonFromPromptCached = mod.generateJsonFromPrompt;
  return generateJsonFromPromptCached;
}

async function withTempSpecFile(specText, fn) {
  const tmpDir = path.join(agentDir, ".tmp");
  await fs.mkdir(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `spec_${Date.now()}_${Math.random().toString(16).slice(2)}.md`);
  await fs.writeFile(filePath, String(specText ?? ""), "utf8");
  try {
    return await fn(filePath);
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}

async function compilePrompt({ template, includes }) {
  return renderTemplate(path.join(agentDir, template), {
    includes,
    rootDir: agentDir,
    strict: true,
    maxDepth: 20,
    encoding: "utf-8",
  });
}

async function generateLayoutFromSpec({ spec, id } = {}) {
  if (typeof spec !== "string" || !spec.trim()) {
    throw new Error("Campo 'spec' (string) e obrigatorio.");
  }

  const generateJsonFromPrompt = await getGenerateJsonFromPrompt();

  const layout = await withTempSpecFile(spec, async (specFilePath) => {
    const prompt = await compilePrompt({
      template: "prompts/gerar_layout_full_agent_prompt.md",
      includes: {
        layout_json_schema: "schemas/layout.schema.json",
        layout_component_definitions: "prompts/includes/definicoes_componentes.md",
        layout_examples: "prompts/includes/exemplos_canonicos_layouts.md",
        spec: specFilePath,
      },
    });

    return await generateJsonFromPrompt(prompt);
  });

  if (id && typeof id === "string") {
    layout.id = id;
  }

  return layout;
}

async function generateEntityFromSpec({ spec, id } = {}) {
  if (typeof spec !== "string" || !spec.trim()) {
    throw new Error("Campo 'spec' (string) e obrigatorio.");
  }

  const generateJsonFromPrompt = await getGenerateJsonFromPrompt();

  const entity = await withTempSpecFile(spec, async (specFilePath) => {
    const prompt = await compilePrompt({
      template: "prompts/gerar_entidade_full_agent_prompt.md",
      includes: {
        json_schema: "schemas/entity.schema.json",
        field_types_definitions: "prompts/includes/definicoes_campos_entidades.md",
        filters_definitions: "prompts/includes/definicoes_filtros_entidades.md",
        entity_examples: "prompts/includes/exemplos_canonicos_entidades.md",
        spec: specFilePath,
      },
    });

    return await generateJsonFromPrompt(prompt);
  });

  if (id && typeof id === "string") {
    entity.id = id;
  }

  return entity;
}

module.exports = { generateEntityFromSpec, generateLayoutFromSpec };

