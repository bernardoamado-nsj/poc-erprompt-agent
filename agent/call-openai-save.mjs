import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { generateJsonFromPrompt } from "./openai-client.mjs";

async function main() {
  // Uso:
  // node ./agent/call-openai-save.mjs <prompt.txt> <saida.json>
  const promptPath = process.argv[2];
  const outPath = process.argv[3];

  if (!promptPath || !outPath) {
    console.error("Uso: node ./agent/call-openai-save.mjs <arquivo_prompt.txt> <arquivo_saida.json>");
    process.exit(1);
  }

  const prompt = await fs.readFile(promptPath, "utf8");

  // Garante diretório de saída
  await fs.mkdir(path.dirname(outPath), { recursive: true }).catch(() => {});

  try {
    const jsonObj = await generateJsonFromPrompt(prompt);
    await fs.writeFile(outPath, JSON.stringify(jsonObj, null, 2), "utf8");
    console.log(`OK: JSON salvo em ${outPath}`);
  } catch (err) {
    // Se o erro trouxe resposta bruta, salva para depuração
    const raw = err?.raw;
    if (raw) {
      const fallbackTxt = outPath.replace(/\.json$/i, "") + ".raw.txt";
      await fs.writeFile(fallbackTxt, raw, "utf8");
      console.error(`Falha ao parsear JSON. Resposta bruta salva em: ${fallbackTxt}`);
    }
    console.error("Erro:", err?.message || err);
    process.exit(2);
  }
}

main();
