// ===== CONFIGURAÇÃO DE AMBIENTE =====
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3001/api"
    : "/api";

// ===== STATE =====
let cart = [];
let currentClienteId = null;
let produtosCache = [];

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  carregarProdutosLoja();
  setupForms();
  loadCart();
});

// ===== LOJA (ATUALIZADO COM API_BASE) =====
async function carregarProdutosLoja() {
  try {
    const res = await fetch(`${API_BASE}/produtos`); // Alterado para usar API_BASE
    let data = await res.json();
    data = data.filter((p) => (p.nome || p.Nome || "").trim().length > 0);
    produtosCache = data;
    renderProdutos(produtosCache);
  } catch (e) {
    document.getElementById("productsGrid").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌸</div>
        <p>Erro ao carregar produtos. Verifique a conexão.</p>
      </div>`;
  }
}

// ... (Mantenha suas funções normalizarProduto, renderProdutos, filtrarProdutos, addToCart, etc.)

// ===== CHECKOUT (FINALIZADO) =====
async function confirmarPedido() {
  if (!currentClienteId) {
    showToast(
      "Por favor, identifique-se com seu e-mail antes de finalizar.",
      "error",
    );
    return;
  }

  const metodoPagamento = document.querySelector(
    'input[name="pagamento"]:checked',
  )?.value;
  const metodoEntrega = document.querySelector(
    'input[name="entrega"]:checked',
  )?.value;
  const enderecoEntrega = document.getElementById("enderecoEntrega").value;

  const total = cart.reduce(
    (s, i) => s + parseFloat(i.preco) * i.quantidade,
    0,
  );

  const body = {
    clienteId: currentClienteId,
    total: total,
    metodoPagamento: metodoPagamento || "Não informado",
    metodoEntrega: metodoEntrega || "Retirada",
    enderecoEntrega:
      metodoEntrega === "entrega" ? enderecoEntrega : "Retirada na loja",
    itens: JSON.stringify(
      cart.map((i) => ({
        produtoId: i.produtoId,
        nome: i.nome,
        quantidade: i.quantidade,
        preco: i.preco,
      })),
    ),
  };

  try {
    const res = await fetch(`${API_BASE}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showToast("Pedido realizado com sucesso! Gratidão! 🌸", "success");
      cart = [];
      saveCart();
      updateCartUI();
      closeModal("modal-checkout");
      showPage("loja");
    } else {
      throw new Error("Erro ao processar pedido no servidor");
    }
  } catch (e) {
    showToast("Erro ao confirmar pedido. Tente novamente.", "error");
  }
}

// ===== ADMIN (ATUALIZADO COM API_BASE) =====
async function carregarProdutosAdmin() {
  const container = document.getElementById("tbodyProdutos");
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/produtos`);
    const produtos = await res.json();
    // ... seu código de mapeamento continua igual
  } catch (e) {
    console.error(e);
  }
}

async function carregarClientes() {
  try {
    const res = await fetch(`${API_BASE}/clientes`);
    const clientes = await res.json();
    // ... seu código de mapeamento continua igual
  } catch (e) {
    console.error(e);
  }
}

// ===== DELETE (EXEMPLO DE AJUSTE) =====
async function deletarProduto(id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;
  try {
    const res = await fetch(`${API_BASE}/produtos/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Produto removido!", "success");
      carregarProdutosLoja();
      carregarProdutosAdmin();
    }
  } catch (e) {
    showToast("Erro ao excluir", "error");
  }
}

// Certifique-se de aplicar `${API_BASE}/` em todos os outros fetches:
// buscarClienteCheckout, buscarAreaCliente, carregarPedidos, atualizarStatus, etc.
