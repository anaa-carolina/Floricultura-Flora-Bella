const express = require("express");
const router = express.Router();
const { getTableClient } = require("../azureConfig");
const { v4: uuidv4 } = require("uuid");

// Nome da tabela no Azure
const tableClient = getTableClient("Clientes");

// Rota: Listar todos os clientes
router.get("/", async (req, res) => {
  const clientes = [];
  try {
    const entities = tableClient.listEntities();
    for await (const entity of entities) {
      clientes.push(entity);
    }
    res.json(clientes);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar clientes" });
  }
});

// Rota: Buscar cliente por ID (Útil para edição)
router.get("/:id", async (req, res) => {
  try {
    const entity = await tableClient.getEntity("Cliente", req.params.id);
    res.json(entity);
  } catch (e) {
    res.status(404).json({ error: "Cliente não encontrado" });
  }
});

// Rota: Criar novo cliente
router.post("/", async (req, res) => {
  try {
    const id = uuidv4();
    // Construímos o objeto garantindo as chaves do Azure
    const cliente = {
      partitionKey: "Cliente",
      rowKey: id,
      ...req.body,
    };
    await tableClient.createEntity(cliente);
    res.status(201).json(cliente);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rota: Atualizar cliente (O seu app.js usa isso!)
router.put("/:id", async (req, res) => {
  try {
    const clienteAtualizado = {
      partitionKey: "Cliente",
      rowKey: req.params.id,
      ...req.body,
    };
    // 'merge' atualiza apenas os campos enviados sem apagar os outros
    await tableClient.updateEntity(clienteAtualizado, "merge");
    res.json({ message: "Cliente atualizado com sucesso!" });
  } catch (e) {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

// Rota: Deletar cliente
router.delete("/:id", async (req, res) => {
  try {
    await tableClient.deleteEntity("Cliente", req.params.id);
    res.json({ message: "Cliente excluído!" });
  } catch (e) {
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
});

module.exports = router;
