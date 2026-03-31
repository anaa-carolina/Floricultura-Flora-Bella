const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { getTableClient, blobServiceClient } = require("../azureConfig");
const { v4: uuidv4 } = require("uuid");

// Nome da Tabela e do Container de Fotos no Azure
const tableClient = getTableClient("ProdutosAnaCarolina");
const containerClient =
  blobServiceClient.getContainerClient("anacarolina-fotos");

// Rota: Listar todos os produtos
router.get("/", async (req, res) => {
  try {
    const produtos = [];
    for await (const entity of tableClient.listEntities()) {
      produtos.push(entity);
    }
    res.json(produtos);
  } catch (e) {
    res.status(500).json([]);
  }
});

// Rota: Criar novo produto (com upload de foto)
router.post("/", upload.single("foto"), async (req, res) => {
  try {
    const id = uuidv4();
    let fotoUrl = req.body.fotoUrl || "";

    // Se uma imagem foi enviada pelo formulário
    if (req.file) {
      const blobName = `${id}-${req.file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });
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

// Rota: Editar produto existente (O seu app.js precisa disso!)
router.put("/:id", upload.single("foto"), async (req, res) => {
  try {
    const id = req.params.id;
    let fotoUrl = req.body.fotoUrl;

    // Se o usuário trocou a foto na edição
    if (req.file) {
      const blobName = `${id}-${req.file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });
      fotoUrl = blockBlobClient.url;
    }

    const produtoAtualizado = {
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

    // 'merge' para não apagar campos que não foram enviados
    await tableClient.updateEntity(produtoAtualizado, "merge");
    res.json({
      message: "Produto atualizado com sucesso!",
      produto: produtoAtualizado,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao editar produto: " + err.message });
  }
});

// Rota: Excluir produto
router.delete("/:id", async (req, res) => {
  try {
    await tableClient.deleteEntity("Produto", req.params.id);
    res.json({ msg: "Excluído com sucesso" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
