// call-openai-planner.mjs
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import "dotenv/config";
import OpenAI from "openai";

import { fileURLToPath } from "node:url";

/**
 * Tenta chamar com um modelo; se falhar por incompatibilidade com json_schema,
 * tenta fallback.
 */
async function tryResponsesCreate(client, payload, fallbackModel) {
  try {
    return await client.responses.create(payload);
  } catch (err) {
    const msg = String(err?.message || err);
    const looksLikeFormatIssue =
      msg.includes("response_format") ||
      msg.includes("json_schema") ||
      msg.includes("Invalid schema") ||
      msg.includes("format") ||
      msg.includes("unsupported");

    if (!fallbackModel || !looksLikeFormatIssue) throw err;

    return await client.responses.create({ ...payload, model: fallbackModel });
  }
}

export async function callOpenAIPlannerStructured({
  promptText,
  plannerSchema,
  outPath,
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL_PLANNER || process.env.OPENAI_MODEL || "gpt-5.2",
  fallbackModel = process.env.OPENAI_MODEL_PLANNER_FALLBACK || "gpt-4o-2024-08-06",
  schemaName = "planner_output",
}) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não encontrada. Verifique seu .env.");
  }
  const client = new OpenAI({ apiKey });

  const payload = {
    model,
    input: promptText,
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema: plannerSchema,
      },
    },
  };

  const response = await tryResponsesCreate(client, payload, fallbackModel);

  const outText = response.output_text?.trim() ?? "";

  await fs.mkdir(path.dirname(outPath), { recursive: true }).catch(() => {});

  try {
    const parsed = JSON.parse(outText);
    await fs.writeFile(outPath, JSON.stringify(parsed, null, 2), "utf8");
    return { ok: true, outPath };
  } catch (err) {
    const fallbackTxt = outPath.replace(/\.json$/i, "") + ".raw.txt";
    await fs.writeFile(fallbackTxt, outText, "utf8");
    return {
      ok: false,
      outPath: fallbackTxt,
      error: `Falha ao parsear JSON do planner. Resposta bruta salva em ${fallbackTxt}. Motivo: ${err?.message || err}`,
    };
  }
}

// CLI:
// node call-openai-planner.mjs <prompt.txt> <planner.schema.json> <saida.json>
async function main() {
  const promptPath = process.argv[2];
  const schemaPath = process.argv[3];
  const outPath = process.argv[4];

  if (!promptPath || !schemaPath || !outPath) {
    console.error("Uso: node call-openai-planner.mjs <prompt.txt> <planner.schema.json> <saida.json>");
    process.exit(1);
  }

  const [promptText, schemaText] = await Promise.all([
    fs.readFile(promptPath, "utf8"),
    fs.readFile(schemaPath, "utf8"),
  ]);

  const plannerSchema = JSON.parse(schemaText);

  const result = await callOpenAIPlannerStructured({
    promptText,
    plannerSchema,
    outPath,
  });

  if (!result.ok) {
    console.error(result.error);
    process.exit(2);
  }

  console.log(`OK: Planner JSON salvo em ${result.outPath}`);
}

//console.log('url: ', import.meta.url);
//console.log('argv[1]: ', process.argv[1]);
//
//if (import.meta.url === `file://${process.argv[1]}`) {
//  main().catch((err) => {
//    console.error("Falha na chamada à API:", err?.message || err);
//    process.exit(1);
//  });
//}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch((err) => {
    console.error("Falha na chamada à API:", err?.message || err);
    process.exit(1);
  });
}
