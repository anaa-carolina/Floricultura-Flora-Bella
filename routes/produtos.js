const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { getTableClient, blobServiceClient } = require("../azureConfig");
const { v4: uuidv4 } = require("uuid");

const tableClient = getTableClient("ProdutosAnaCarolina");
const containerClient =
  blobServiceClient.getContainerClient("anacarolina-fotos");

// Inicialização segura: Verifica se existe antes de criar
async function initAzure() {
  try {
    // createTable retornará erro se já existir, então usamos um try/catch vazio ou verificação
    await tableClient.createTable().catch(() => {
      /* Tabela já existe, ignora */
    });
    await containerClient.createIfNotExists({ access: "blob" });
    console.log("✅ Azure Produtos: Tabelas e Blobs verificados.");
  } catch (e) {
    console.log("ℹ️ Azure Produtos: Tabelas já configuradas.");
  }
}
initAzure();

router.get("/", async (req, res) => {
  try {
    const produtos = [];
    for await (const entity of tableClient.listEntities()) {
      produtos.push(entity);
    }
    res.json(produtos);
  } catch (e) {
    res.json([]);
  }
});

router.post("/", upload.single("foto"), async (req, res) => {
  try {
    const id = uuidv4();
    let fotoUrl = req.body.fotoUrl || "";

    if (req.file) {
      const blobName = `${id}-${req.file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(req.file.buffer);
      fotoUrl = blockBlobClient.url;
    }

    const produto = {
      partitionKey: "Produto",
      rowKey: id,
      nome: req.body.nome,
      marca: req.body.marca,
      modelo: req.body.modelo,
      preco: parseFloat(req.body.preco || 0),
      quantidade: parseInt(req.body.quantidade || 0),
      categoria: req.body.categoria,
      descricao: req.body.descricao,
      fotoUrl: fotoUrl,
    };

    await tableClient.createEntity(produto);
    res.status(201).json(produto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await tableClient.deleteEntity("Produto", req.params.id);
    res.json({ msg: "Excluído" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
