const express = require("express");
const router = express.Router();
const { getTableClient } = require("../azureConfig");
const { v4: uuidv4 } = require("uuid");

// Nome da tabela no Azure (deve ser o mesmo usado no Portal)
const tableClient = getTableClient("PedidosAnaCarolina");

// Rota: Listar todos os pedidos (para o Admin)
router.get("/", async (req, res) => {
  const pedidos = [];
  try {
    const entities = tableClient.listEntities();
    for await (const entity of entities) {
      pedidos.push(entity);
    }
    res.json(pedidos);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar pedidos" });
  }
});

// Rota: Criar novo pedido (Checkout)
router.post("/", async (req, res) => {
  try {
    const id = uuidv4();
    const pedido = {
      partitionKey: "Pedido",
      rowKey: id,
      ...req.body,
      // Garantimos que itens seja uma string para o Azure Table
      itens:
        typeof req.body.itens === "string"
          ? req.body.itens
          : JSON.stringify(req.body.itens),
      criadoEm: new Date().toISOString(),
      status: "confirmado",
    };
    await tableClient.createEntity(pedido);
    res.status(201).json(pedido);
  } catch (e) {
    res.status(500).json({ error: "Erro ao criar pedido: " + e.message });
  }
});

// Rota: Atualizar apenas o STATUS do pedido (Admin)
// O app.js chama: fetch(`/api/pedidos/${id}/status`, ...)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const entity = {
      partitionKey: "Pedido",
      rowKey: req.params.id,
      status: status,
    };
    // O modo 'merge' atualiza apenas o campo 'status' sem apagar o resto do pedido
    await tableClient.updateEntity(entity, "merge");
    res.json({ message: "Status atualizado com sucesso!" });
  } catch (e) {
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

// Rota: Deletar pedido (Admin)
router.delete("/:id", async (req, res) => {
  try {
    await tableClient.deleteEntity("Pedido", req.params.id);
    res.json({ message: "Pedido removido com sucesso!" });
  } catch (e) {
    res.status(500).json({ error: "Erro ao excluir pedido" });
  }
});

module.exports = router;
