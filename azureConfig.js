// Carrega as configurações do arquivo .env para o process.env
require("dotenv").config();

// Obtém a string de conexão das variáveis de ambiente
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Validação de segurança para ajudar no debug
if (!connectionString) {
  console.error("---------------------------------------------------------");
  console.error("❌ ERRO CRÍTICO: String de conexão do Azure não encontrada!");
  console.error("Verifique se o arquivo .env existe e contém a chave:");
  console.error("AZURE_STORAGE_CONNECTION_STRING='sua_chave_aqui'");
  console.error("---------------------------------------------------------");
}

module.exports = {
  connectionString,
  // Exportamos também os nomes das tabelas para centralizar a configuração
  tables: {
    produtos: "Produtos",
    clientes: "Clientes",
    pedidos: "Pedidos",
  },
  containers: {
    imagens: "produtos-imagens",
  },
};
