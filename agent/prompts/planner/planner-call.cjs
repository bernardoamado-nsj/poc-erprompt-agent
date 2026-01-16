"use strict";

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

// 1) Carregue o JSON Schema do planner de um arquivo
//    (por exemplo: ./planner.schema.json, que você gerou anteriormente)
const plannerSchemaPath = path.join(__dirname, "planner.schema.json");
const PLANNER_SCHEMA = JSON.parse(fs.readFileSync(plannerSchemaPath, "utf8"));

// 2) Client OpenAI (usa OPENAI_API_KEY do env)
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Chama o Planner e retorna o objeto já parseado (conforme o schema).
 */
async function runPlanner({ userSpec, defaultScope = "geral" }) {
  const systemInstructions = [
    "Você é um planificador de POC.",
    "Converta a especificação funcional do PO em um plano executável.",
    "Regras:",
    "- Inferir o melhor escopo; se não der, usar 'geral'.",
    "- Se o PO não especificar telas, gerar padrão C: listagem + cadastro/edição + detalhe para a entidade principal.",
    "- Retornar somente dados (sem explicações).",
  ].join("\n");

  // IMPORTANTE: Structured Outputs é configurado aqui:
  // text.format.type = "json_schema" + strict = true + schema = ...
  const resp = await client.responses.create({
    model: "gpt-4o-2024-08-06",
    instructions: systemInstructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Escopo default (fallback): ${defaultScope}\n\n` +
              `ESPECIFICAÇÃO DO USUÁRIO (PO):\n${userSpec}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "planner_output",
        strict: true,
        schema: PLANNER_SCHEMA,
      },
    },
  });

  // O SDK expõe output_text (string) para o texto final.
  // Como você exigiu json_schema, isso deve ser um JSON válido conforme schema.
  const jsonText = resp.output_text;

  // Parse para objeto JS (se falhar, você sabe que algo saiu do esperado)
  const plan = JSON.parse(jsonText);

  return { plan, raw: resp };
}

// Exemplo de execução via CLI:
// node planner_call.cjs "Quero um módulo de NF-e com listagem, cadastro e detalhe..."
async function main() {
  const userSpec = process.argv.slice(2).join(" ").trim();
  if (!userSpec) {
    console.error("Uso: node planner_call.cjs \"<spec do PO>\"");
    process.exit(1);
  }

  const { plan } = await runPlanner({ userSpec, defaultScope: "geral" });

  // Salva para inspeção/debug do POC
  fs.writeFileSync(
    path.join(__dirname, "planner.output.json"),
    JSON.stringify(plan, null, 2),
    "utf8"
  );

  console.log("Planner OK. Arquivo gerado: planner.output.json");
}

main().catch((err) => {
  console.error("Erro chamando planner:", err);
  process.exit(1);
});
