#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Matches an "@include <target>" directive anywhere in the text.
 * We decide in the replace callback whether it's a full-line include or inline include.
 *
 * Target rules (same as before):
 * - "$token" resolves via opts.includes[token]
 * - otherwise it's treated as a path (relative/absolute rules in resolvePath)
 *
 * Note: paths with spaces are not supported (consistent with existing usage).
 */
const INCLUDE_RE = /@include\s+(?<target>\$[A-Za-z_][A-Za-z0-9_]*|[^\s]+)/g;
/** Matches "$token" */
const TOKEN_RE = /^\$(?<name>[A-Za-z_][A-Za-z0-9_]*)$/;

class IncludeError extends Error {
  constructor(message) {
    super(message);
    this.name = "IncludeError";
  }
}

function computeLineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") starts.push(i + 1);
  }
  return starts;
}

function lineNumberFromPos(lineStarts, pos) {
  // binary search; returns 1-based line number
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (lineStarts[mid] <= pos) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi + 1;
}

/**
 * Resolve paths according to the policy:
 *  - absolute => direct
 *  - starts with ./ or ../ => relative to baseDir
 *  - otherwise => relative to rootDir
 */
function resolvePath(rawPath, baseDir, rootDir) {
  if (!rawPath || typeof rawPath !== "string") {
    throw new IncludeError(`Caminho inválido: '${rawPath}'`);
  }

  // Normalize Windows backslashes but keep semantics
  const p = rawPath;

  // 1) Absolute (handle both POSIX and Windows)
  if (path.isAbsolute(p)) {
    return path.resolve(p);
  }

  // 2) Explicit relative to including file
  if (p.startsWith("./") || p.startsWith("../")) {
    return path.resolve(baseDir, p);
  }

  // 3) Otherwise relative to rootDir
  return path.resolve(rootDir, p);
}

function resolveTarget(rawTarget, baseDir, rootDir, includes) {
  const m = rawTarget.match(TOKEN_RE);
  if (m && m.groups && m.groups.name) {
    const name = m.groups.name;
    if (!(name in includes)) {
      throw new IncludeError(
        `Token '${name}' não foi fornecido. ` +
          `Você precisa passar '--${name} <arquivo>' para atender '@include $${name}'.`
      );
    }
    return resolvePath(includes[name], baseDir, rootDir);
  }

  // direct include
  return resolvePath(rawTarget, baseDir, rootDir);
}

function readTextFile(filePath, encoding) {
  return fs.readFileSync(filePath, { encoding });
}

/**
 * Renders a template starting at templatePath.
 * @param {string} templatePath
 * @param {object} opts
 * @returns {string}
 */
function renderTemplate(templatePath, opts = {}) {
  const {
    maxDepth = 20,
    strict = true,
    encoding = "utf-8",
    includes = {},
    rootDir = process.cwd(),
  } = opts;

  const absTemplate = path.resolve(templatePath);
  const visited = new Set();

  return renderFile({
    filePath: absTemplate,
    includes,
    visited,
    depth: 0,
    maxDepth,
    strict,
    encoding,
    rootDir: path.resolve(rootDir),
  });
}

function renderFile({
  filePath,
  includes,
  visited,
  depth,
  maxDepth,
  strict,
  encoding,
  rootDir,
}) {
  if (depth > maxDepth) {
    throw new IncludeError(
      `Profundidade máxima de includes excedida (${maxDepth}). Arquivo: ${filePath}`
    );
  }

  if (visited.has(filePath)) {
    throw new IncludeError(`Loop de includes detectado. Arquivo já incluído: ${filePath}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new IncludeError(`Arquivo não encontrado: ${filePath}`);
  }

  visited.add(filePath);

  const content = readTextFile(filePath, encoding);
  const baseDir = path.dirname(filePath);
  const lineStarts = computeLineStarts(content);

  function getLineBounds(text, pos) {
    const lineStart = text.lastIndexOf("\n", pos - 1) + 1; // -1 => 0
    const lineEndIdx = text.indexOf("\n", pos);
    const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
    return { lineStart, lineEnd };
  }

  function flattenInline(text) {
    // Inline includes are commonly used for tokens like scope/code.
    // Flatten any multi-line includes to a single line to avoid breaking surrounding text.
    return String(text ?? "").replace(/\r?\n/g, " ").trim();
  }

  // We need match positions for line numbers, so we use replace callback with offset.
  const rendered = content.replace(INCLUDE_RE, (fullMatch, _unused, offset, _whole, groups) => {
    const rawTarget = String(groups?.target ?? "").trim();
    const includeLine = lineNumberFromPos(lineStarts, offset);

    //const { lineStart, lineEnd } = getLineBounds(content, offset);
    //const before = content.slice(lineStart, offset);
    //const after = content.slice(offset + fullMatch.length, lineEnd);
    //const isFullLineInclude = before.trim() === "" && after.trim() === "";

    try {
      const targetPath = resolveTarget(rawTarget, baseDir, rootDir, includes);

      if (!fs.existsSync(targetPath)) {
        const msg =
          `Include não encontrado: '${rawTarget}'\n` +
          `  Arquivo: ${filePath}\n` +
          `  Linha: ${includeLine}\n` +
          `  Resolvido para: ${targetPath}`;

        if (strict) throw new IncludeError(msg);
        return fullMatch; // keep original
      }

      // included = renderFile({...
      return renderFile({
        filePath: targetPath,
        includes,
        visited,
        depth: depth + 1,
        maxDepth,
        strict,
        encoding,
        rootDir,
      });

      //return isFullLineInclude ? included : flattenInline(included);
    } catch (e) {
      if (strict) {
        const msg =
          `${e instanceof Error ? e.message : String(e)}\n\n` +
          `Contexto do include:\n  Arquivo: ${filePath}\n  Linha: ${includeLine}`;
        throw new IncludeError(msg);
      }
      return fullMatch;
    }
  });

  visited.delete(filePath);
  return rendered;
}

/**
 * Parse unknown args as includes: --token value
 * Rules:
 *  - only flags like --name (no --a=b)
 *  - each flag must have a value immediately after
 */
function parseUnknownArgsAsIncludes(unknownArgs) {
  const includes = {};
  let i = 0;

  while (i < unknownArgs.length) {
    const arg = unknownArgs[i];

    if (!arg.startsWith("--")) {
      throw new IncludeError(
        `Argumento inesperado: '${arg}'. Esperado algo como '--token valor'.`
      );
    }

    const key = arg.slice(2);
    if (!key) throw new IncludeError(`Flag inválida: '${arg}'.`);

    if (key.includes("=")) {
      throw new IncludeError(
        `Formato não suportado: '${arg}'. Use '--token valor' (sem '=').`
      );
    }

    if (i + 1 >= unknownArgs.length) {
      throw new IncludeError(`Flag '${arg}' sem valor. Use '--${key} <arquivo>'.`);
    }

    const value = unknownArgs[i + 1];
    if (value.startsWith("--")) {
      throw new IncludeError(`Flag '${arg}' sem valor (encontrado '${value}').`);
    }

    includes[key] = value;
    i += 2;
  }

  return includes;
}

/**
 * Minimal arg parser that supports:
 *  template (positional)
 *  -o/--output
 *  --max-depth
 *  --non-strict
 *  --encoding
 *  --root-dir
 * And leaves the rest as unknown (for tokens).
 */
function parseArgs(argv) {
  const known = {
    template: null,
    output: null,
    maxDepth: 20,
    nonStrict: false,
    encoding: "utf-8",
    rootDir: null,
  };

  const unknown = [];

  const takeValue = (i) => {
    if (i + 1 >= argv.length) return null;
    return argv[i + 1];
  };

  let i = 0;
  while (i < argv.length) {
    const a = argv[i];

    // Positional template (first non-flag)
    if (!a.startsWith("-") && known.template === null) {
      known.template = a;
      i += 1;
      continue;
    }

    // Known flags
    if (a === "-o" || a === "--output") {
      const v = takeValue(i);
      if (v == null) throw new IncludeError(`Flag '${a}' sem valor.`);
      known.output = v;
      i += 2;
      continue;
    }

    if (a === "--max-depth") {
      const v = takeValue(i);
      if (v == null) throw new IncludeError(`Flag '${a}' sem valor.`);
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) {
        throw new IncludeError(`Valor inválido para --max-depth: '${v}'.`);
      }
      known.maxDepth = n;
      i += 2;
      continue;
    }

    if (a === "--non-strict") {
      known.nonStrict = true;
      i += 1;
      continue;
    }

    if (a === "--encoding") {
      const v = takeValue(i);
      if (v == null) throw new IncludeError(`Flag '${a}' sem valor.`);
      known.encoding = v;
      i += 2;
      continue;
    }

    if (a === "--root-dir") {
      const v = takeValue(i);
      if (v == null) throw new IncludeError(`Flag '${a}' sem valor.`);
      known.rootDir = v;
      i += 2;
      continue;
    }

    if (a === "-h" || a === "--help") {
      known.help = true;
      i += 1;
      continue;
    }

    // Everything else is "unknown" (tokens, etc.)
    unknown.push(a);
    i += 1;
  }

  return { known, unknown };
}

function printHelp() {
  const text = `
Usage:
  render-template <template> [options] [--token value ...]

Description:
  Renderiza templates com diretivas '@include' (estilo PHP include).
  Tokens são declarados no template como '@include $token' e passados via '--token caminho'.

Options:
  -o, --output <arquivo>     Arquivo de saída. Se omitido, imprime no stdout.
  --max-depth <n>            Profundidade máxima de recursão de includes (default: 20).
  --non-strict               Se ativado, includes inválidos não geram erro e são mantidos no texto.
  --encoding <enc>           Encoding dos arquivos (default: utf-8).
  --root-dir <dir>           Diretório raiz para resolver includes sem prefixo (default: diretório atual).
                             Use './' ou '../' para caminhos relativos ao template.

Examples:
  node render-template.js prompts/gerar_entidade_full_user.md \\
    --json_schema schemas/entity.schema.json \\
    --field_types_definitions prompts/includes/definicoes_campos2.md \\
    -o final_prompt_web.md
`.trim();
  console.log(text);
}

function main(argv) {
  try {
    const { known, unknown } = parseArgs(argv);

    if (known.help) {
      printHelp();
      return 0;
    }

    if (!known.template) {
      printHelp();
      throw new IncludeError("Template principal não informado.");
    }

    const includes = parseUnknownArgsAsIncludes(unknown);
    const rootDir = known.rootDir ? path.resolve(known.rootDir) : process.cwd();

    const rendered = renderTemplate(known.template, {
      maxDepth: known.maxDepth,
      strict: !known.nonStrict,
      encoding: known.encoding,
      includes,
      rootDir,
    });

    if (known.output) {
      fs.writeFileSync(known.output, rendered, { encoding: known.encoding });
    } else {
      process.stdout.write(rendered);
    }

    return 0;
  } catch (e) {
    if (e instanceof IncludeError) {
      process.stderr.write(`ERRO: ${e.message}\n`);
      return 2;
    }
    process.stderr.write(`ERRO INESPERADO: ${e instanceof Error ? e.message : String(e)}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

// Export for programmatic use (e.g., inside json-server scripts)
module.exports = {
  IncludeError,
  renderTemplate,
};
