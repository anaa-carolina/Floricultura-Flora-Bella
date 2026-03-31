const express = require("express");
const router = express.Router();
const { getTableClient } = require("../azureConfig");
const { v4: uuidv4 } = require("uuid");

const tableClient = getTableClient("PedidosAnaCarolina");

async function init() {
  await tableClient.createTable().catch(() => {});
}
init();

router.get("/", async (req, res) => {
  const pedidos = [];
  try {
    for await (const entity of tableClient.listEntities()) {
      pedidos.push(entity);
    }
  } catch (e) {}
  res.json(pedidos);
});

router.post("/", async (req, res) => {
  try {
    const pedido = {
      partitionKey: "Pedido",
      rowKey: uuidv4(),
      ...req.body,
      itens: JSON.stringify(req.body.itens),
      criadoEm: new Date().toISOString(),
      status: "confirmado",
    };
    await tableClient.createEntity(pedido);
    res.json(pedido);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
