# 🌸 Flora Bella — Floricultura E-commerce

Aplicação web de e-commerce para floricultura integrada com **Azure Blob Storage** (Imagens) e **Azure Table Storage** (Banco de Dados).

O projeto utiliza uma arquitetura **SPA (Single Page Application)** no frontend e um servidor **Node.js** robusto no backend.

## 🚀 Como Executar

### 1. Instalar dependências

Certifique-se de ter o Node.js instalado. No terminal, execute:

```bash
npm install express cors path @azure/data-tables @azure/storage-blob multer
```

### 2. Configurar variáveis de ambiente

Verifique se o seu arquivo `azureConfig.js` (ou `.env`) contém a **String de Conexão** correta do seu portal Azure.

### 3. Iniciar o servidor

```bash
npm start
```

Acesse no navegador: **http://localhost:3001**

---

## 🏗️ Arquitetura do Projeto

```
floricultura/
├── server.js             # Servidor Express (Rotas e Middleware)
├── azureConfig.js        # Configurações de conexão com Azure
├── routes/
│   ├── produtos.js       # CRUD de produtos + Lógica de Upload
│   ├── clientes.js       # CRUD de clientes + Busca por Email
│   └── pedidos.js        # Gestão de Pedidos e Checkout
├── public/               # Frontend (Arquivos Estáticos)
│   ├── index.html        # Estrutura principal (SPA)
│   ├── css/
│   │   └── style.css     # Design Responsivo e Moderno
│   └── js/
│       └── app.js        # Lógica de Integração e Consumo da API
└── node_modules/         # Dependências do projeto
```

---

## ☁️ Serviços Azure Utilizados

### **Azure Blob Storage**

- **Container**: `produtos-imagens`
- **Uso**: Armazena as fotos enviadas pelo painel administrativo.
- **Diferencial**: URLs públicas são geradas e salvas automaticamente na tabela de produtos.

### **Azure Table Storage**

| Tabela     | Função                                         |
| ---------- | ---------------------------------------------- |
| `Produtos` | Estoque, Preços, Descrições e Links das Fotos. |
| `Clientes` | Cadastro, Emails, CPFs e Endereços.            |
| `Pedidos`  | Histórico de compras, Status e Totalizadores.  |

---

## 🌿 Funcionalidades Implementadas

### **Área da Loja (Cliente)**

- ✅ **Catálogo Dinâmico:** Renderização automática de produtos vindos do Azure.
- ✅ **Filtros Avançados:** Busca por Nome, Marca e faixa de Preço (Mín/Máx).
- ✅ **Carrinho Inteligente:** Soma de totais e persistência local.
- ✅ **Checkout Integrado:** Busca de cliente por email e seleção de entrega/pagamento.
- ✅ **Área do Cliente:** Login simplificado para ver histórico de pedidos e editar dados.

### **Painel Administrativo (Gestão)**

- ✅ **Controle de Estoque:** Cadastro de novos itens com upload de imagem.
- ✅ **Edição em Tempo Real:** Atualização de preços e quantidades sem recarregar a página.
- ✅ **Gestão de Clientes:** Visualização e edição da base de contatos.
- ✅ **Monitor de Pedidos:** Acompanhamento de todas as vendas realizadas.

---

## 📡 API Endpoints Principais

| Método | Rota                         | Função                                                |
| ------ | ---------------------------- | ----------------------------------------------------- |
| `GET`  | `/api/produtos`              | Lista produtos (com suporte a filtros).               |
| `POST` | `/api/produtos`              | Cria produto e faz upload da foto para o Blob.        |
| `POST` | `/api/pedidos`               | Finaliza compra e registra no Table Storage.          |
| `GET`  | `/api/clientes/email/:email` | Busca dados do cliente para preenchimento automático. |

---

## 🛠️ Tecnologias

- **Backend:** Node.js, Express.js.
- **Frontend:** HTML5, CSS3 (Variáveis, Flexbox, Grid), JavaScript (Vanilla/ES6).
- **Nuvem:** Microsoft Azure (Storage Account).
- **Upload:** Multer (Middleware).

---

