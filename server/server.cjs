const jsonServer = require('json-server');
const path = require("path");

const server = jsonServer.create();
const dbPath = path.join(__dirname, "db.json"); // server/db.json
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

server.use(middlewares);
//server.use(jsonServer.json()); // Essential for parsing POST bodies

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