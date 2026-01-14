import "dotenv/config";
import OpenAI from "openai";

/**
 * Gera um JSON (objeto JS) a partir de um prompt já compilado.
 * - Força resposta em JSON válido via json_object.
 * - Retorna o objeto parseado (não string).
 */
export async function generateJsonFromPrompt(prompt, options = {}) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Prompt vazio ou inválido.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não encontrada. Verifique o arquivo .env.");
  }

  const model = options.model || process.env.OPENAI_MODEL || "gpt-5.2";

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model,
    input: prompt,
    text: {
      format: { type: "json_object" } // força JSON válido
    },
    // max_output_tokens: options.max_output_tokens ?? 4000,
  });

  const outText = (response.output_text || "").trim();
  if (!outText) {
    throw new Error("Resposta vazia da API.");
  }

  try {
    return JSON.parse(outText);
  } catch (err) {
    // Ajuda na depuração: devolve também o texto bruto no erro
    const e = new Error(`Resposta não é JSON parseável: ${err?.message || err}`);
    e.raw = outText;
    throw e;
  }
}
