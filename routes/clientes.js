const express = require("express");
const router = express.Router();
const { getTableClient } = require("../azureConfig");
const { v4: uuidv4 } = require("uuid");

const tableClient = getTableClient("ClientesAnaCarolina");

async function init() {
  // Tenta criar, se já existir o Azure ignora o comando internamente com o catch
  await tableClient.createTable().catch(() => {});
}
init();

router.get("/", async (req, res) => {
  const clientes = [];
  try {
    for await (const entity of tableClient.listEntities()) {
      clientes.push(entity);
    }
  } catch (e) {}
  res.json(clientes);
});

router.post("/", async (req, res) => {
  try {
    const id = uuidv4();
    const cliente = { partitionKey: "Cliente", rowKey: id, ...req.body };
    await tableClient.createEntity(cliente);
    res.json(cliente);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
