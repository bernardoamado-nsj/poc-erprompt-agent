const jsonServer = require('json-server');
const path = require("path");

const { generateEntityFromSpec, generateLayoutFromSpec } = require(path.join(__dirname, "..", "agent", "generator.cjs"));

const server = jsonServer.create();
const dbPath = path.join(__dirname, "db.json"); // server/db.json
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser); // Essential for parsing POST bodies

// Add custom middleware to fix the double slash issue
server.use((req, res, next) => {
  // Check if the URL contains a double slash
  if (req.url.includes('//')) {
    // Replace all occurrences of // with /
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});

// mock emitir CTe chamada direta
server.post('/emissor-cte/:cteId/emitir', (req, res) => {
  res.status(200).json({
	"id": "a8d24805-cfb3-4eec-9ee4-258639f61a8d",
	"chave": "33250618756022000141573000000020011065196757",
	//"situacao": "rejeitado",
    "situacao": "autorizado",
	//"situacao_sefaz": "675",
    "situacao_sefaz": "200",
	//"mensagem_sefaz": "Rejeição: Valor do imposto não corresponde a base de calculo X aliquota"
    "mensagem_sefaz": "Autorizado"
  });
});

// mock emitir cte chamada pela API de forca de vendas
server.post('/2711/cte/montar-emitir', (req, res) => {

});

server.get("/configuracoes", (req, res) => {
  const db = router.db;               // lowdb instance
  const arr = db.get("configuracoes").value();

  if (Array.isArray(arr) && arr.length > 0) {
    return res.json(arr[0]);          // return first record as object
  }

  // Choose one behavior:
  return res.status(404).json({ error: "configuracoes not found" });
  // or: return res.json({});
});

function getFirstString(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseGeneratedPageId(id) {
  if (typeof id !== "string") return { escopo: "", codigo: "" };
  const parts = id.split(".");
  if (parts.length >= 2) return { escopo: parts[0], codigo: parts.slice(1).join(".") };
  return { escopo: "", codigo: id };
}

function ensureArrayCollection(db, collection) {
  const value = db.get(collection).value();
  if (!Array.isArray(value)) {
    db.set(collection, []).write();
  }
}

function upsertById(db, collection, item) {
  if (!item || typeof item !== "object") throw new Error("item must be an object");
  if (!item.id) throw new Error("item.id is required");

  ensureArrayCollection(db, collection);
  db.get(collection).remove({ id: item.id }).write();
  db.get(collection).push(item).write();
}

server.post("/agent/generate-layout", async (req, res) => {
  try {
    const spec = getFirstString(req.body?.spec);
    const requestedId = getFirstString(req.body?.id);
    const requestedDescricao = getFirstString(req.body?.descricao);

    if (typeof spec !== "string" || !spec.trim()) {
      return res.status(400).json({ error: "Campo 'spec' (string) e obrigatorio." });
    }

    const layout = await generateLayoutFromSpec({ spec, id: requestedId });
    if (!layout?.id) {
      return res.status(422).json({ error: "O JSON gerado nao contem 'id'. Envie 'id' no body para forcar." });
    }

    const db = router.db;
    upsertById(db, "layouts-schemas", layout);

    const parsedId = parseGeneratedPageId(layout.id);
    const generatedPage = {
      id: layout.id,
      escopo: layout.escopo ?? parsedId.escopo,
      codigo: layout.codigo ?? parsedId.codigo,
      descricao: requestedDescricao ?? layout.descricao ?? layout.id,
    };
    upsertById(db, "generated-pages", generatedPage);

    return res.status(201).json({ generatedPage, layout });
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

server.post("/agent/generate-entity", async (req, res) => {
  try {
    const spec = getFirstString(req.body?.spec);
    const requestedId = getFirstString(req.body?.id);

    if (typeof spec !== "string" || !spec.trim()) {
      return res.status(400).json({ error: "Campo 'spec' (string) e obrigatorio." });
    }

    const entity = await generateEntityFromSpec({ spec, id: requestedId });
    if (!entity?.id) {
      return res.status(422).json({ error: "O JSON gerado nao contem 'id'. Envie 'id' no body para forcar." });
    }

    const db = router.db;
    upsertById(db, "entities-schemas", entity);

    return res.status(201).json({ entity });
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});


router.render = (req, res) => {
  // Check if the original path starts with /launcher-itens
  // We use req.path here because req.url might contain query strings
  if (req.path === '/launcher-itens') {
    res.jsonp({
      result: res.locals.data
    });
  } else {
    // Continue with the standard json-server behavior for all other routes
    res.jsonp(res.locals.data);
  }
};

server.use(router);
server.listen(4000, () => {
  console.log('JSON Server is running on port 4000');
});
