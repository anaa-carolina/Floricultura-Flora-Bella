// 1. Importa as bibliotecas necessárias do Azure
const { TableClient } = require("@azure/data-tables");
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

// 2. Obtém a string de conexão das variáveis de ambiente (Vercel ou .env local)
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Validação de segurança para o seu Terminal
if (!connectionString) {
  console.error("❌ ERRO: AZURE_STORAGE_CONNECTION_STRING não configurada!");
}

// 3. Configura o cliente de Blobs (para as fotos das flores)
const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

// 4. Função auxiliar para conectar com as Tabelas (Produtos, Clientes, Pedidos)
function getTableClient(tableName) {
  return TableClient.fromConnectionString(connectionString, tableName);
}

// 5. Exporta tudo o que o seu Backend (server.js e rotas) precisa
module.exports = {
  connectionString,
  blobServiceClient,
  getTableClient,
  // Nomes centralizados das tabelas (opcional, mas ajuda na organização)
  tables: {
    produtos: "ProdutosAnaCarolina",
    clientes: "ClientesAnaCarolina",
    pedidos: "PedidosAnaCarolina",
  },
  containers: {
    fotos: "anacarolina-fotos",
  },
};
