import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import "dotenv/config";
import OpenAI from "openai";

async function main() {
  // Uso:
  // node call-openai-save.mjs <prompt.txt> <saida.json>
  const promptPath = process.argv[2];
  const outPath = process.argv[3];

  if (!promptPath || !outPath) {
    console.error("Uso: node call-openai-save.mjs <arquivo_prompt_compilado.txt> <arquivo_saida.json>");
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  if (!apiKey) {
    console.error("Erro: OPENAI_API_KEY não encontrada. Verifique seu arquivo .env.");
    process.exit(1);
  }

  const prompt = await fs.readFile(promptPath, "utf8");

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model,
    input: prompt,
    text: {
      format: { type: "json_object" }, // força JSON válido
    },
    // max_output_tokens: 4000, // ajuste se necessário
  });

  const outText = response.output_text?.trim() ?? "";

  // Garante que o diretório de saída existe
  await fs.mkdir(path.dirname(outPath), { recursive: true }).catch(() => {});

  // Tenta parsear e salvar JSON bonitinho
  try {
    const parsed = JSON.parse(outText);
    await fs.writeFile(outPath, JSON.stringify(parsed, null, 2), "utf8");
    console.log(`OK: JSON salvo em ${outPath}`);
  } catch (err) {
    // Se não conseguir parsear, salva o bruto para você inspecionar
    const fallbackTxt = outPath.replace(/\.json$/i, "") + ".raw.txt";
    await fs.writeFile(fallbackTxt, outText, "utf8");
    console.error(
      `Falha ao fazer parse do JSON. Salvei a resposta bruta em: ${fallbackTxt}\n` +
      `Motivo: ${err?.message || err}`
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("Falha na chamada à API:", err?.message || err);
  process.exit(1);
});
