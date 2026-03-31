const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); // 1. Carrega as variáveis do .env

// Importação das rotas
const rotaProdutos = require("./routes/produtos");
const rotaClientes = require("./routes/clientes");
const rotaPedidos = require("./routes/pedidos");

const app = express();

// 2. Ajuste de Porta (essencial para Vercel/Azure/Render)
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---
app.use("/api/produtos", rotaProdutos);
app.use("/api/clientes", rotaClientes);
app.use("/api/pedidos", rotaPedidos);

// --- ARQUIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, "public")));

// Rota curinga para SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
// Apenas inicia o listen se não estiver em ambiente de teste ou serverless específico
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`
        🌸 FLORICULTURA FLORA BELLA 🌸
        --------------------------------------------
        Servidor rodando na porta: ${PORT}
        Aguardando conexões com Azure...
        --------------------------------------------
        `);
  });
}

// 3. EXPORTAÇÃO (Obrigatório para o Vercel funcionar)
module.exports = app;
