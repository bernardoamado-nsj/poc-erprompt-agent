const { renderTemplate } = require("./render-template");

const prompt = renderTemplate("prompts/gerar_entidade_full_user.md", {
  includes: {
    json_schema: "schemas/entity.schema.json",
    field_types_definitions: "prompts/includes/definicoes_campos2.md",
    filters_definitions: "prompts/includes/definicoes_filtros.md",
    spec: "prompts/specs/minha_spec.md",
  },
  rootDir: process.cwd(),
  strict: true,
  maxDepth: 20,
  encoding: "utf-8",
});
