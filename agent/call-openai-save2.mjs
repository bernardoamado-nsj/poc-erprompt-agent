// call-openai-save.mjs
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import "dotenv/config";
import OpenAI from "openai";

export async function callOpenAISaveJsonObject({
  promptText,
  outPath,
  model = process.env.OPENAI_MODEL_JSON || process.env.OPENAI_MODEL || "gpt-5.2",
  apiKey = process.env.OPENAI_API_KEY,
}) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não encontrada. Verifique seu .env.");
  }
  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model,
    input: promptText,
    text: { format: { type: "json_object" } },
  });

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
      error: `Falha ao parsear JSON. Resposta bruta salva em ${fallbackTxt}. Motivo: ${err?.message || err}`,
    };
  }
}

// CLI:
// node call-openai-save.mjs <prompt.txt> <saida.json>
async function main() {
  const promptPath = process.argv[2];
  const outPath = process.argv[3];

  if (!promptPath || !outPath) {
    console.error("Uso: node call-openai-save.mjs <arquivo_prompt_compilado.txt> <arquivo_saida.json>");
    process.exit(1);
  }

  const promptText = await fs.readFile(promptPath, "utf8");
  const result = await callOpenAISaveJsonObject({ promptText, outPath });

  if (!result.ok) {
    console.error(result.error);
    process.exit(2);
  }

  console.log(`OK: JSON salvo em ${result.outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Falha na chamada à API:", err?.message || err);
    process.exit(1);
  });
}
