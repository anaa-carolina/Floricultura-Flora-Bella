const express = require("express");
const cors = require("cors");
const path = require("path");

// Importação das suas rotas (Verifique se os arquivos existem nestes caminhos)
const rotaProdutos = require("./routes/produtos");
const rotaClientes = require("./routes/clientes");
const rotaPedidos = require("./routes/pedidos");

const app = express();
const PORT = 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROTAS DA API (Devem vir ANTES dos arquivos estáticos) ---
// Se o navegador pedir /api/produtos, o Express entra aqui primeiro.
app.use("/api/produtos", rotaProdutos);
app.use("/api/clientes", rotaClientes);
app.use("/api/pedidos", rotaPedidos);

// --- ARQUIVOS ESTÁTICOS (Frontend) ---
// Isso serve o seu index.html, css/style.css e js/app.js
app.use(express.static(path.join(__dirname, "public")));

// Rota curinga para SPA (Single Page Application)
// Se o usuário digitar uma rota que não existe, ele volta para o index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`
    🌸 FLORICULTURA FLORA BELLA 🌸
    --------------------------------------------
     Servidor rodando em: http://localhost:${PORT}
     Aguardando conexões com Azure...
    --------------------------------------------
    `);
});
