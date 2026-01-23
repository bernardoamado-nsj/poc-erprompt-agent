const jsonServer = require("json-server");
const path = require("path");
//const express = require("express"); // precisa instalar express? json-server já usa express internamente; geralmente está ok
const crypto = require("crypto");

const server = jsonServer.create();
const dbPath = path.join(__dirname, "db.json");
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

const PROJECT_ROOT_DIR = path.join(__dirname, '..');
const SERVER_DIR = __dirname;
const AGENT_DIR = path.join(PROJECT_ROOT_DIR, 'agent');

server.use(middlewares);
server.use(jsonServer.bodyParser); // <--- IMPORTANTE para POST

// Corrigir double slash
server.use((req, res, next) => {
  if (req.url.includes("//")) req.url = req.url.replace(/\/+/g, "/");
  next();
});

// Servir arquivos gerados
//server.use("/generated", express.static(path.join(process.cwd(), "generated")));
//server.use("/generated", express.static(path.join(PROJECT_ROOT_DIR, "generated")));
//server.use("/generated", jsonServer.router(path.join(PROJECT_ROOT_DIR, "generated")));


// Plugar rotas de AI runs
//const attachAiRunsRoutes = require("./server/ai-runs.cjs"); // ajuste o path conforme onde você salvar
const attachAiRunsRoutes = require(path.join(SERVER_DIR, "ai-runs.cjs"));
attachAiRunsRoutes(server, {
  projectRoot: PROJECT_ROOT_DIR,
  agentDir: path.join(AGENT_DIR),
  generateScript: path.join(AGENT_DIR, "generate.mjs"),
  generatedDir: path.join(PROJECT_ROOT_DIR, "generated"),
  db: router.db
});

// Endpoint genérico para datasets dinâmicos (evita precisar reiniciar quando surgem novas keys no db.json)
// Ex.: GET/POST/PUT/DELETE em /mock/<resource> onde <resource> é o nome da coleção no db.json.
server.get("/mock/:resource", (req, res) => {
  const resource = String(req.params.resource || "").trim();
  if (!resource) return res.status(400).json({ error: "resource inválido" });

  const data = router.db.get(resource).value();
  if (!data) return res.status(404).json({ error: `resource '${resource}' not found` });
  return res.json(data);
});

server.get("/mock/:resource/:id", (req, res) => {
  const resource = String(req.params.resource || "").trim();
  const id = String(req.params.id || "").trim();
  if (!resource || !id) return res.status(400).json({ error: "resource/id inválidos" });

  const data = router.db.get(resource).value();
  if (!Array.isArray(data)) return res.status(404).json({ error: `resource '${resource}' not found` });

  const item = data.find((x) => x && String(x.id) === id);
  if (!item) return res.status(404).json({ error: "not found" });
  return res.json(item);
});

server.post("/mock/:resource", (req, res) => {
  const resource = String(req.params.resource || "").trim();
  if (!resource) return res.status(400).json({ error: "resource inválido" });

  const data = router.db.get(resource).value();
  if (!Array.isArray(data)) return res.status(404).json({ error: `resource '${resource}' not found` });

  const payload = (req.body && typeof req.body === "object") ? { ...req.body } : {};
  if (!payload.id) payload.id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

  data.push(payload);
  router.db.set(resource, data).write();
  return res.status(201).json(payload);
});

server.put("/mock/:resource/:id", (req, res) => {
  const resource = String(req.params.resource || "").trim();
  const id = String(req.params.id || "").trim();
  if (!resource || !id) return res.status(400).json({ error: "resource/id inválidos" });

  const data = router.db.get(resource).value();
  if (!Array.isArray(data)) return res.status(404).json({ error: `resource '${resource}' not found` });

  const idx = data.findIndex((x) => x && String(x.id) === id);
  if (idx < 0) return res.status(404).json({ error: "not found" });

  const payload = (req.body && typeof req.body === "object") ? { ...req.body } : {};
  data[idx] = { ...data[idx], ...payload, id };
  router.db.set(resource, data).write();
  return res.json(data[idx]);
});

server.delete("/mock/:resource/:id", (req, res) => {
  const resource = String(req.params.resource || "").trim();
  const id = String(req.params.id || "").trim();
  if (!resource || !id) return res.status(400).json({ error: "resource/id inválidos" });

  const data = router.db.get(resource).value();
  if (!Array.isArray(data)) return res.status(404).json({ error: `resource '${resource}' not found` });

  const next = data.filter((x) => !(x && String(x.id) === id));
  if (next.length === data.length) return res.status(404).json({ error: "not found" });

  router.db.set(resource, next).write();
  return res.status(204).send();
});

router.render = (req, res) => {
  if (req.path === "/launcher-itens") res.jsonp({ result: res.locals.data });
  else res.jsonp(res.locals.data);
};

server.use(router);

server.listen(4000, () => {
  console.log("JSON Server is running on port 4000");
});
