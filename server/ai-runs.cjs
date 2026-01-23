"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

function makeRunId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ts =
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "_" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds());
  const rnd = crypto.randomBytes(3).toString("hex");
  return `run_${ts}_${rnd}`;
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true }).catch(() => {});
}

async function writeJson(p, obj) {
  await ensureDir(path.dirname(p));
  await fsp.writeFile(p, JSON.stringify(obj, null, 2), "utf8");
}

async function readJson(p) {
  const txt = await fsp.readFile(p, "utf8");
  return JSON.parse(txt);
}

function safeJoin(base, ...parts) {
  const full = path.resolve(base, ...parts);
  if (!full.startsWith(path.resolve(base))) throw new Error("Path traversal detected");
  return full;
}

function layoutId(escopo, codigo) {
  // Seu padrão: fiscal.list-notas-fiscais
  return `${escopo}.${codigo}`;
}

async function registerGeneratedPagesFromPlan({ generatedDir, runId, db }) {
  if (!db) return; // se não passou db, não registra

  const plannerPath = path.join(generatedDir, "runs", runId, "planner.json");
  if (!fs.existsSync(plannerPath)) return;

  const plan = await readJson(plannerPath);
  const layouts = Array.isArray(plan.layouts) ? plan.layouts : [];
  if (!layouts.length) return;

  // garante coleção
  const col = db.get("generated-pages");
  if (!col.value()) db.set("generated-pages", []).write();

  for (const lay of layouts) {
    const escopo = lay.escopo || plan.escopo_padrao || "geral";
    const codigo = lay.codigo;
    const descricao = lay.descricao || codigo;

    if (!codigo) continue;

    const id = layoutId(escopo, codigo);

    const existing = db.get("generated-pages").find({ id }).value();

    const record = {
      id,
      escopo,
      codigo,
      descricao,

      // campos extras internos (backend usa; frontend pode ignorar)
      runId,
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      db.get("generated-pages").find({ id }).assign(record).write();
    } else {
      db.get("generated-pages").push(record).write();
    }
  }
}

async function commitMocksFromRun({ generatedDir, runId, db, baseUrl }) {
  if (!db) return;

  const runDir = path.join(generatedDir, "runs", runId);
  const mocksDir = path.join(runDir, "mocks");
  if (!fs.existsSync(mocksDir)) return;

  // garante endpoints
  const eps = db.get("endpoints").value();
  if (!Array.isArray(eps)) db.set("endpoints", []).write();

  const walk = async (dir) => {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...(await walk(p)));
      else if (e.isFile() && e.name.endsWith(".mock.json")) out.push(p);
    }
    return out;
  };

  const files = await walk(mocksDir);

  for (const fp of files) {
    const mock = await readJson(fp);
    const schemaId = mock.schema;     // fiscal/Nfe
    const resource = mock.resource;   // nfes
    const items = mock.items;

    if (!schemaId || !resource || !Array.isArray(items)) continue;

    const [escopo, codigo] = schemaId.split("/", 2);
    if (!escopo || !codigo) continue;

    const id = `${escopo}.${codigo}`;
    // Use um endpoint genérico para evitar precisar reiniciar o json-server quando surgem novos "resources" no db.json.
    // Esse endpoint é servido por `server/server.cjs` em `/mock/:resource`.
    const endpointUrl = `${baseUrl.replace(/\/+$/, "")}/mock/${resource}`;

    // upsert em endpoints por id
    const existing = db.get("endpoints").find({ id }).value();
    const record = { id, escopo, codigo, schema: schemaId, endpoint: endpointUrl };
    if (existing) db.get("endpoints").find({ id }).assign(record).write();
    else db.get("endpoints").push(record).write();

    // replace dataset do resource
    db.set(resource, items).write();
  }
}



async function walkFiles(dir, predicateFn) {
  if (!fs.existsSync(dir)) return [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkFiles(p, predicateFn)));
    else if (e.isFile() && predicateFn(p)) out.push(p);
  }
  return out;
}

function ensureArrayCollection(db, name) {
  const v = db.get(name).value();
  if (!Array.isArray(v)) db.set(name, []).write();
}

function upsertById(db, collection, obj) {
  ensureArrayCollection(db, collection);
  const id = obj?.id;
  if (!id) return;

  const found = db.get(collection).find({ id }).value();
  if (found) db.get(collection).find({ id }).assign(obj).write();
  else db.get(collection).push(obj).write();
}

/**
 * Salva os JSONs completos das ENTIDADES em /entities-schemas
 * Fonte: generated/runs/<runId>/entities/<escopo>/<Codigo>.json
 */
async function commitEntitySchemasFromRun({ generatedDir, runId, db }) {
  const runDir = path.join(generatedDir, "runs", runId);
  const entitiesDir = path.join(runDir, "entities");

  const entityFiles = await walkFiles(entitiesDir, (p) => p.endsWith(".json"));

  for (const fp of entityFiles) {
    const entity = await readJson(fp);

    const escopo = entity.escopo;
    const codigo = entity.codigo;
    if (!escopo || !codigo) continue;

    //const id = `${escopo}.${codigo}`;
    const id = codigo;

    // objeto que o frontend busca via /entities-schemas
    const record = {
      id,
      ...entity, // o JSON completo
      //escopo,
      //codigo,
      //schema: `${escopo}/${codigo}`, // útil para resolver por schema também
      //descricao: entity.descricao || "",
      //entity_json: entity // o JSON completo
    };

    upsertById(db, "entities-schemas", record);
  }
}

/**
 * Salva os JSONs completos dos LAYOUTS em /layouts-schemas
 * Fonte: generated/runs/<runId>/layouts/<escopo>/<codigo>.json
 */
async function commitLayoutSchemasFromRun({ generatedDir, runId, db }) {
  const runDir = path.join(generatedDir, "runs", runId);
  const layoutsDir = path.join(runDir, "layouts");

  const layoutFiles = await walkFiles(layoutsDir, (p) => p.endsWith(".json"));

  for (const fp of layoutFiles) {
    const layout = await readJson(fp);

    const escopo = layout.escopo;
    const codigo = layout.codigo;
    if (!escopo || !codigo) continue;

    const id = `${escopo}.${codigo}`;

    const record = {
      id,
      ...layout // o JSON completo
    };

    upsertById(db, "layouts-schemas", record);
  }
}


module.exports = function attachAiRunsRoutes(server, opts = {}) {
  const projectRoot = opts.projectRoot || process.cwd();
  const agentDir = opts.agentDir || path.join(projectRoot, "agent");
  const generateScript = opts.generateScript || path.join(agentDir, "generate.mjs");
  const generatedDir = opts.generatedDir || path.join(projectRoot, "generated");
  const db = opts.db || null;

  const activeFile = path.join(generatedDir, "active-run.json");

  if (!fs.existsSync(generateScript)) {
    throw new Error(`generate.mjs não encontrado em: ${generateScript}`);
  }

  // POST /ai/runs { spec: "..." }
  server.post("/ai/runs", async (req, res) => {
    try {
      const spec = (req.body && req.body.spec) ? String(req.body.spec).trim() : "";
      if (!spec) return res.status(400).json({ error: "Campo 'spec' é obrigatório." });

      // 1 job por vez
      if (fs.existsSync(activeFile)) {
        const active = await readJson(activeFile).catch(() => null);
        if (active && (active.status === "queued" || active.status === "running")) {
          return res.status(409).json({ error: "Já existe uma geração em andamento.", activeRun: active });
        }
      }

      const runId = makeRunId();
      const runDir = path.join(generatedDir, "runs", runId);
      await ensureDir(runDir);

      // status inicial
      const statusPath = path.join(runDir, "status.json");
      await writeJson(statusPath, {
        runId,
        status: "queued",
        createdAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
        exitCode: null,
        error: null
      });

      await writeJson(activeFile, {
        runId,
        status: "queued",
        statusUrl: `/ai/runs/${runId}/status`,
        createdAt: new Date().toISOString()
      });

      // dispara generate
      const child = spawn(process.execPath, [generateScript, spec], {
        cwd: projectRoot,
        env: {
          ...process.env,
          RUN_ID: runId,            // <= importante: seu generate deve respeitar isso
          GENERATED_DIR: generatedDir
        },
        stdio: ["ignore", "pipe", "pipe"]
      });

      // log
      const logPath = path.join(runDir, "run.log");
      const logStream = fs.createWriteStream(logPath, { flags: "a" });
      child.stdout.on("data", (d) => logStream.write(d));
      child.stderr.on("data", (d) => logStream.write(d));

      // running
      await writeJson(statusPath, {
        runId,
        status: "running",
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        finishedAt: null,
        exitCode: null,
        error: null
      });
      await writeJson(activeFile, {
        runId,
        status: "running",
        statusUrl: `/ai/runs/${runId}/status`,
        createdAt: new Date().toISOString()
      });

      child.on("close", async (code) => {
        logStream.end();

        let status = "failed";
        if (code === 0) status = "done";
        else if (code === 3) status = "blocked";

        const finishedPayload = {
          runId,
          status,
          createdAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          exitCode: code,
          error: status === "failed" ? `Process exited with code ${code}` : null
        };

        await writeJson(statusPath, finishedPayload).catch(() => {});
        await writeJson(activeFile, { runId, status, statusUrl: `/ai/runs/${runId}/status` }).catch(() => {});

        // Se finalizou com sucesso, registra os layouts em generated-pages
        if (status === "done") {
          await registerGeneratedPagesFromPlan({ generatedDir, runId, db })
            .catch(() => {});
          await commitMocksFromRun({
            generatedDir,
            runId,
            db,
            baseUrl: "http://localhost:4000"
          }).catch(() => {});
          await commitEntitySchemasFromRun({ generatedDir, runId, db })
            .catch(() => {});
          await commitLayoutSchemasFromRun({ generatedDir, runId, db })
            .catch(() => {});
        }
      });

      return res.status(202).json({
        runId,
        status: "queued",
        statusUrl: `/ai/runs/${runId}/status`
      });
    } catch (err) {
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // GET /ai/runs/:runId/status
  server.get("/ai/runs/:runId/status", async (req, res) => {
    try {
      const runId = String(req.params.runId || "").trim();
      if (!runId) return res.status(400).json({ error: "runId inválido" });

      const statusPath = safeJoin(generatedDir, "runs", runId, "status.json");
      if (!fs.existsSync(statusPath)) return res.status(404).json({ error: "Run não encontrado" });

      const status = await readJson(statusPath);

      // Anexa log (tail truncado) ao payload de status
      let log = null;
      let logTruncated = false;
      let logSize = 0;
      try {
        const logPath = safeJoin(generatedDir, "runs", runId, "run.log");
        if (fs.existsSync(logPath)) {
          const buf = await fsp.readFile(logPath, "utf8");
          logSize = buf.length;
          const MAX_CHARS = 20000; // tail ~20k chars para evitar respostas muito grandes
          if (buf.length > MAX_CHARS) {
            log = buf.slice(-MAX_CHARS);
            logTruncated = true;
          } else {
            log = buf;
          }
        }
      } catch (_) {
        // ignora erro de leitura do log
      }

      return res.json({ ...status, log, logTruncated, logSize });
    } catch (err) {
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // GET /generated-pages/:id/layout  -> retorna o JSON do layout pelo id (sem expor path pro frontend)
  server.get("/generated-pages/:id/layout", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB não configurado no attachAiRunsRoutes." });

      const id = String(req.params.id || "").trim();
      if (!id) return res.status(400).json({ error: "id inválido" });

      const page = db.get("generated-pages").find({ id }).value();
      if (!page) return res.status(404).json({ error: "Página não encontrada" });

      const escopo = page.escopo;
      const codigo = page.codigo;

      // Para POC: devolver a última versão (runId salvo no registro)
      const runId = page.runId;
      if (!runId) return res.status(404).json({ error: "Página não possui runId associado." });

      const layoutFile = safeJoin(generatedDir, "runs", runId, "layouts", escopo, `${codigo}.json`);
      if (!fs.existsSync(layoutFile)) {
        return res.status(404).json({ error: "Arquivo de layout não encontrado para esta página." });
      }

      const layoutJson = await readJson(layoutFile);
      return res.json(layoutJson);
    } catch (err) {
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });
};


