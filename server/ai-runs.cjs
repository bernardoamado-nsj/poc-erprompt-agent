"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

function makeRunId() {
  // run_20260119_143310_abc123
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

module.exports = function attachAiRunsRoutes(server, opts = {}) {
  const projectRoot = opts.projectRoot || process.cwd();

  // Ajuste: onde está seu generate.mjs
  const agentDir = opts.agentDir || path.join(projectRoot, "agent");
  const generateScript = opts.generateScript || path.join(agentDir, "generate.mjs");

  // Pasta generated (base)
  const generatedDir = opts.generatedDir || path.join(projectRoot, "generated");

  // Single-run lock file
  const activeFile = path.join(generatedDir, "active-run.json");

  if (!fs.existsSync(generateScript)) {
    throw new Error(`generate.mjs não encontrado em: ${generateScript}`);
  }

  // POST /ai/runs  { spec: "..." }
  server.post("/ai/runs", async (req, res) => {
    try {
      const spec = (req.body && req.body.spec) ? String(req.body.spec).trim() : "";
      if (!spec) return res.status(400).json({ error: "Campo 'spec' é obrigatório." });

      // Se já existe um run ativo, bloqueia (porque você quer 1 por vez)
      if (fs.existsSync(activeFile)) {
        const active = await readJson(activeFile).catch(() => null);
        if (active && (active.status === "queued" || active.status === "running")) {
          return res.status(409).json({
            error: "Já existe uma geração em andamento.",
            activeRun: active
          });
        }
      }

      const runId = makeRunId();
      const runDir = path.join(generatedDir, "runs", runId);
      await ensureDir(runDir);

      // Status inicial
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

      // Marca como ativo
      await writeJson(activeFile, {
        runId,
        status: "queued",
        statusUrl: `/ai/runs/${runId}/status`,
        createdAt: new Date().toISOString()
      });

      // Dispara processo em background
      const child = spawn(process.execPath, [generateScript, spec], {
        cwd: projectRoot,
        env: {
          ...process.env,
          RUN_ID: runId,
          GENERATED_DIR: generatedDir // garante que o generate escreve aqui
        },
        stdio: ["ignore", "pipe", "pipe"]
      });

      // Log do processo
      const logPath = path.join(runDir, "run.log");
      const logStream = fs.createWriteStream(logPath, { flags: "a" });
      child.stdout.on("data", (d) => logStream.write(d));
      child.stderr.on("data", (d) => logStream.write(d));

      // Atualiza para running
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

        const finished = {
          runId,
          status,
          createdAt: new Date().toISOString(),
          startedAt: null, // opcional: você pode ler do status anterior se quiser
          finishedAt: new Date().toISOString(),
          exitCode: code,
          error: status === "failed" ? `Process exited with code ${code}` : null,
          artifacts: {
            runDir: path.join("generated", "runs", runId),
            planner: path.join("generated", "runs", runId, "planner.json"),
            questions: path.join("generated", "runs", runId, "questions.json"),
            metrics: path.join("generated", "runs", runId, "metrics.json")
          }
        };

        await writeJson(statusPath, finished).catch(() => {});
        await writeJson(activeFile, { runId, status, statusUrl: `/ai/runs/${runId}/status` }).catch(
          () => {}
        );
      });

      return res.status(202).json({
        runId,
        status: "queued",
        statusUrl: `/ai/runs/${runId}/status`,
        runDir: `/generated/runs/${runId}`
      });
    } catch (err) {
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // GET /ai/runs/active
  server.get("/ai/runs/active", async (req, res) => {
    try {
      if (!fs.existsSync(activeFile)) return res.status(404).json({ error: "Nenhum run ativo." });
      const active = await readJson(activeFile);
      return res.json(active);
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
      return res.json(status);
    } catch (err) {
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // (Opcional) GET /ai/runs/:runId/log
  server.get("/ai/runs/:runId/log", async (req, res) => {
    try {
      const runId = String(req.params.runId || "").trim();
      const logPath = safeJoin(generatedDir, "runs", runId, "run.log");
      if (!fs.existsSync(logPath)) return res.status(404).send("log não encontrado");

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      fs.createReadStream(logPath).pipe(res);
    } catch (err) {
      return res.status(500).send(err?.message || String(err));
    }
  });
};
