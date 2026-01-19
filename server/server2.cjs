const jsonServer = require("json-server");
const path = require("path");
const express = require("express"); // precisa instalar express? json-server já usa express internamente; geralmente está ok

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
server.use("/generated", express.static(path.join(PROJECT_ROOT_DIR, "generated")));

// Plugar rotas de AI runs
//const attachAiRunsRoutes = require("./server/ai-runs.cjs"); // ajuste o path conforme onde você salvar
const attachAiRunsRoutes = require(path.join(SERVER_DIR, "ai-runs.cjs"));
attachAiRunsRoutes(server, {
  projectRoot: PROJECT_ROOT_DIR,
  agentDir: path.join(AGENT_DIR),
  generateScript: path.join(AGENT_DIR, "generate4.mjs"),
  generatedDir: path.join(PROJECT_ROOT_DIR, "generated")
});

// Suas rotas custom
server.post("/emissor-cte/:cteId/emitir", (req, res) => {
  res.status(200).json({
    id: "a8d24805-cfb3-4eec-9ee4-258639f61a8d",
    chave: "33250618756022000141573000000020011065196757",
    situacao: "autorizado",
    situacao_sefaz: "200",
    mensagem_sefaz: "Autorizado"
  });
});

server.post("/2711/cte/montar-emitir", (req, res) => {});

server.get("/configuracoes", (req, res) => {
  const db = router.db;
  const arr = db.get("configuracoes").value();
  if (Array.isArray(arr) && arr.length > 0) return res.json(arr[0]);
  return res.status(404).json({ error: "configuracoes not found" });
});

router.render = (req, res) => {
  if (req.path === "/launcher-itens") res.jsonp({ result: res.locals.data });
  else res.jsonp(res.locals.data);
};

server.use(router);

server.listen(4000, () => {
  console.log("JSON Server is running on port 4000");
});
