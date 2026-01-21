import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import "dotenv/config";
import OpenAI from "openai";

export async function callOpenAIMockStructured({ promptText, mockSchema, outPath }) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-5.2";

    if (!apiKey) return { ok: false, error: "OPENAI_API_KEY não encontrada." };
    if (!promptText || typeof promptText !== "string") return { ok: false, error: "promptText inválido." };
    if (!mockSchema || typeof mockSchema !== "object") return { ok: false, error: "mockSchema inválido." };
    if (!outPath) return { ok: false, error: "outPath é obrigatório." };

    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model,
      input: promptText,
      text: {
        format: {
          type: "json_schema",
          name: "mock_output",
          schema: mockSchema,
          strict: true
        }
      }
    });

    const outText = (response.output_text ?? "").trim();
    const parsed = JSON.parse(outText);

    await fs.mkdir(path.dirname(outPath), { recursive: true }).catch(() => {});
    await fs.writeFile(outPath, JSON.stringify(parsed, null, 2), "utf8");

    return { ok: true, data: parsed };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

// CLI opcional (igual ao seu estilo)
if (import.meta.url.startsWith("file:")) {
  const isMain = process.argv[1] && new URL(import.meta.url).pathname.endsWith(process.argv[1].replace(/\\/g, "/"));
  if (isMain) {
    (async () => {
      const promptPath = process.argv[2];
      const schemaPath = process.argv[3];
      const outPath = process.argv[4];

      if (!promptPath || !schemaPath || !outPath) {
        console.error("Uso: node call-openai-mock.mjs <prompt.txt> <mock.schema.json> <saida.mock.json>");
        process.exit(1);
      }

      const promptText = await fs.readFile(promptPath, "utf8");
      const mockSchema = JSON.parse(await fs.readFile(schemaPath, "utf8"));

      const res = await callOpenAIMockStructured({ promptText, mockSchema, outPath });
      if (!res.ok) {
        console.error("Falha:", res.error);
        process.exit(2);
      }
      console.log(`OK: mock salvo em ${outPath}`);
    })();
  }
}
