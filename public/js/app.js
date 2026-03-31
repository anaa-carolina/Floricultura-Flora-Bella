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

// ===== NAVIGATION =====
function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  document.getElementById("cartBtn").addEventListener("click", openCart);
  document
    .getElementById("areaClienteBtn")
    .addEventListener("click", () => openModal("modal-area-cliente"));
}

function showPage(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(`page-${page}`)?.classList.add("active");

  if (page === "admin-produtos") carregarProdutosAdmin();
  if (page === "admin-clientes") carregarClientes();
  if (page === "admin-pedidos") carregarPedidos();
}

// ===== LOJA =====
async function carregarProdutosLoja() {
  try {
    const res = await fetch("/api/produtos");
    let data = await res.json();
    // Filtrar apenas produtos com dados válidos (que têm nome)
    data = data.filter((p) => (p.nome || p.Nome || "").trim().length > 0);
    produtosCache = data;
    renderProdutos(produtosCache);
  } catch (e) {
    document.getElementById("productsGrid").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌸</div>
        <p>Nenhum produto encontrado</p>
      </div>`;
  }
}

function normalizarProduto(p) {
  return {
    rowKey: p.rowKey || p.RowKey || "",
    nome: p.nome || p.Nome || "",
    marca: p.marca || p.Marca || "",
    modelo: p.modelo || p.Modelo || "",
    categoria: p.categoria || p.Categoria || "",
    preco: parseFloat(p.preco || p.Preco || 0),
    quantidade: parseInt(p.quantidade || p.Quantidade || 0),
    descricao: p.descricao || p.Descricao || "",
    fotoUrl: p.fotoUrl || p.FotoUrl || "",
  };
}

function renderProdutos(produtos) {
  const grid = document.getElementById("productsGrid");
  if (!produtos.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🌸</div><p>Nenhum produto encontrado</p></div>`;
    return;
  }

  const categoriaEmoji = {
    Buquê: "💐",
    Arranjo: "🌷",
    Planta: "🌿",
    Vaso: "🏺",
    Coroa: "👑",
    Outro: "✿",
  };

  grid.innerHTML = produtos
    .map((raw) => {
      const p = normalizarProduto(raw);
      const emoji = categoriaEmoji[p.categoria] || "✿";
      const precoFmt = p.preco.toFixed(2).replace(".", ",");
      const descTrunc = p.descricao
        ? p.descricao.substring(0, 80) + (p.descricao.length > 80 ? "..." : "")
        : "";
      const outOfStock = p.quantidade <= 0;

      return `
    <div class="product-card ${outOfStock ? "out-of-stock" : ""}">
      ${
        p.fotoUrl
          ? `<img src="${p.fotoUrl}" class="product-img" alt="${p.nome}"
             onerror="this.outerHTML='<div class=&quot;product-img-placeholder&quot;>${emoji}</div>'">`
          : `<div class="product-img-placeholder">${emoji}</div>`
      }
      <div class="product-body">
        <div class="product-category">${p.categoria || "Flor"}</div>
        <div class="product-name">${p.nome}</div>
        ${p.marca ? `<div class="product-marca">${p.marca}${p.modelo ? " · " + p.modelo : ""}</div>` : ""}
        ${descTrunc ? `<div class="product-marca" style="font-size:12px;line-height:1.4;margin-top:4px">${descTrunc}</div>` : ""}
        <div class="product-footer">
          <div>
            <div class="product-price">R$ ${precoFmt}</div>
            <div class="product-stock">${p.quantidade > 0 ? p.quantidade + " disponíveis" : "Esgotado"}</div>
          </div>
          <button class="btn-add-cart" onclick="addToCart('${p.rowKey}')" ${p.quantidade <= 0 ? "disabled" : ""}>
            ${p.quantidade > 0 ? "+ Carrinho" : "Esgotado"}
          </button>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

function filtrarProdutos() {
  const nome = document.getElementById("filtroNome").value.toLowerCase();
  const marca = document.getElementById("filtroMarca").value.toLowerCase();
  const min = parseFloat(document.getElementById("filtroMin").value) || 0;
  const max =
    parseFloat(document.getElementById("filtroMax").value) || Infinity;

  const filtrados = produtosCache.filter((raw) => {
    const p = normalizarProduto(raw);
    const matchNome = p.nome.toLowerCase().includes(nome);
    const matchMarca = p.marca.toLowerCase().includes(marca);
    const matchPreco = p.preco >= min && p.preco <= max;

    return matchNome && matchMarca && matchPreco;
  });

  renderProdutos(filtrados);
}

// ===== CART =====
function addToCart(produtoId) {
  const raw = produtosCache.find((p) => (p.rowKey || p.RowKey) === produtoId);
  if (!raw) return;
  const produto = normalizarProduto(raw);

  const existing = cart.find((item) => item.produtoId === produtoId);
  if (existing) {
    if (existing.quantidade >= produto.quantidade) {
      showToast("Limite de estoque atingido", "error");
      return;
    }
    existing.quantidade++;
  } else {
    cart.push({
      produtoId,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
      fotoUrl: produto.fotoUrl,
      categoria: produto.categoria,
    });
  }

  saveCart();
  updateCartUI();
  showToast(`${produto.nome} adicionado ao carrinho! 🌸`, "success");
}

function removeFromCart(produtoId) {
  cart = cart.filter((i) => i.produtoId !== produtoId);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateQty(produtoId, delta) {
  const item = cart.find((i) => i.produtoId === produtoId);
  if (!item) return;
  item.quantidade += delta;
  if (item.quantidade <= 0) removeFromCart(produtoId);
  else {
    saveCart();
    updateCartUI();
    renderCartItems();
  }
}

function updateCartUI() {
  const total = cart.reduce(
    (s, i) => s + parseFloat(i.preco) * i.quantidade,
    0,
  );
  const count = cart.reduce((s, i) => s + i.quantidade, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent =
    `R$ ${total.toFixed(2).replace(".", ",")}`;
}

function renderCartItems() {
  const categoriaEmoji = {
    Buquê: "💐",
    Arranjo: "🌷",
    Planta: "🌿",
    Vaso: "🏺",
    Coroa: "👑",
    Outro: "✿",
  };
  const container = document.getElementById("cartItems");
  if (!cart.length) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:var(--texto-suave)"><p style="font-size:32px">🌸</p><p>Seu carrinho está vazio</p></div>';
    return;
  }
  container.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${
          item.fotoUrl
            ? `<img src="${item.fotoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" onerror="this.parentElement.textContent='${categoriaEmoji[item.categoria] || "✿"}'">`
            : categoriaEmoji[item.categoria] || "✿"
        }
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nome}</div>
        <div class="cart-item-price">R$ ${parseFloat(item.preco).toFixed(2).replace(".", ",")}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty('${item.produtoId}',-1)">−</button>
          <span>${item.quantidade}</span>
          <button class="qty-btn" onclick="updateQty('${item.produtoId}',1)">+</button>
          <button onclick="removeFromCart('${item.produtoId}')" style="margin-left:8px;background:none;border:none;cursor:pointer;color:var(--texto-suave);font-size:14px">✕</button>
        </div>
      </div>
      <div style="font-weight:500;font-size:14px">R$ ${(parseFloat(item.preco) * item.quantidade).toFixed(2).replace(".", ",")}</div>
    </div>
  `,
    )
    .join("");
}

function openCart() {
  renderCartItems();
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
}

function closeCart() {
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
}

function saveCart() {
  try {
    localStorage.setItem("floraCart", JSON.stringify(cart));
  } catch (e) {}
}

function loadCart() {
  try {
    const saved = localStorage.getItem("floraCart");
    if (saved) cart = JSON.parse(saved);
    updateCartUI();
  } catch (e) {
    cart = [];
  }
}

// ===== CHECKOUT =====
function openCheckout() {
  if (!cart.length) {
    showToast("Carrinho vazio!", "error");
    return;
  }
  closeCart();

  // Render checkout items
  const total = cart.reduce(
    (s, i) => s + parseFloat(i.preco) * i.quantidade,
    0,
  );
  document.getElementById("checkoutItems").innerHTML = cart
    .map(
      (item) => `
    <div class="checkout-item">
      <span>${item.nome} × ${item.quantidade}</span>
      <span>R$ ${(parseFloat(item.preco) * item.quantidade).toFixed(2).replace(".", ",")}</span>
    </div>
  `,
    )
    .join("");
  document.getElementById("checkoutTotal").textContent =
    `R$ ${total.toFixed(2).replace(".", ",")}`;
  openModal("modal-checkout");

  // Toggle entrega field
  document.querySelectorAll("[name=entrega]").forEach((r) => {
    r.addEventListener("change", () => {
      document.getElementById("enderecoEntregaField").style.display =
        r.value === "entrega" ? "flex" : "none";
    });
  });
}

async function buscarClienteCheckout() {
  const email = document.getElementById("checkoutEmail").value;
  if (!email) return;
  try {
    const res = await fetch("/api/clientes");
    const clientes = await res.json();
    const cliente = clientes.find(
      (c) => c.email?.toLowerCase() === email.toLowerCase(),
    );
    if (cliente) {
      currentClienteId = cliente.rowKey;
      document.getElementById("clienteInfo").style.display = "block";
      document.getElementById("clienteInfo").innerHTML = `
        <strong>${cliente.nome}</strong><br>
        ${cliente.email} · ${cliente.telefone || ""}<br>
        ${cliente.endereco ? cliente.endereco + ", " + cliente.cidade : ""}
      `;
      if (cliente.endereco)
        document.getElementById("enderecoEntrega").value =
          `${cliente.endereco}, ${cliente.cidade} - ${cliente.estado}`;
      showToast("Cliente encontrado! ✓", "success");
    } else {
      showToast("Cliente não encontrado. Cadastre-se!", "error");
    }
  } catch (e) {
    showToast("Erro ao buscar cliente", "error");
  }
}

async function confirmarPedido() {
  const total = cart.reduce(
    (s, i) => s + parseFloat(i.preco) * i.quantidade,
    0,
  );

  const body = {
    clienteId: currentClienteId,
    total: total, // Adicionado para o Admin ver o valor
    itens: cart.map((i) => ({
      produtoId: i.produtoId,
      nome: i.nome, // Adicionado para aparecer no histórico do cliente
      quantidade: i.quantidade,
      preco: i.preco,
    })),
    metodoPagamento,
    metodoEntrega,
    enderecoEntrega,
  };
}

// ===== ADMIN PRODUTOS (TABELA) =====
async function carregarProdutosAdmin() {
  const container = document.getElementById("tbodyProdutos"); // Certifique-se que esse ID existe no seu HTML
  if (!container) return;

  try {
    const res = await fetch("/api/produtos");
    const produtos = await res.json();

    container.innerHTML =
      produtos
        .map((raw) => {
          const p = normalizarProduto(raw);
          return `
        <tr>
          <td><img src="${p.fotoUrl}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
          <td><strong>${p.nome}</strong></td>
          <td>${p.categoria}</td>
          <td>R$ ${p.preco.toFixed(2).replace(".", ",")}</td>
          <td>${p.quantidade} un</td>
          <td>
            <div class="action-btns">
              <button class="btn-edit" onclick="editarProduto('${p.rowKey}')">✏️</button>
              <button class="btn-delete" onclick="deletarProduto('${p.rowKey}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
        })
        .join("") ||
      '<tr><td colspan="6" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
  } catch (e) {
    console.error("Erro ao carregar admin de produtos:", e);
    container.innerHTML =
      '<tr><td colspan="6" style="text-align:center;">Erro ao carregar dados.</td></tr>';
  }
}
// ===== ADMIN CLIENTES =====
async function carregarClientes() {
  try {
    const res = await fetch("/api/clientes");
    const clientes = await res.json();
    document.getElementById("tbodyClientes").innerHTML =
      clientes
        .map(
          (c) => `
      <tr>
        <td><strong>${c.nome}</strong></td>
        <td>${c.email}</td>
        <td>${c.telefone || "—"}</td>
        <td>${c.cidade || "—"}</td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" onclick="editarCliente('${c.rowKey}')">✏ Editar</button>
            <button class="btn-delete" onclick="deletarCliente('${c.rowKey}')">🗑 Excluir</button>
          </div>
        </td>
      </tr>
    `,
        )
        .join("") ||
      '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--texto-suave)">Nenhum cliente cadastrado</td></tr>';
  } catch (e) {
    console.error(e);
  }
}

async function editarCliente(id) {
  try {
    const res = await fetch(`/api/clientes/${id}`);
    const c = await res.json();
    document.getElementById("clienteId").value = c.rowKey;
    document.getElementById("clienteNome").value = c.nome || "";
    document.getElementById("clienteEmail").value = c.email || "";
    document.getElementById("clienteTelefone").value = c.telefone || "";
    document.getElementById("clienteCpf").value = c.cpf || "";
    document.getElementById("clienteEndereco").value = c.endereco || "";
    document.getElementById("clienteCidade").value = c.cidade || "";
    document.getElementById("clienteEstado").value = c.estado || "";
    document.getElementById("clienteCep").value = c.cep || "";
    document.getElementById("modalClienteTitle").textContent = "Editar Cliente";
    openModal("modal-cliente");
  } catch (e) {
    showToast("Erro ao carregar cliente", "error");
  }
}

async function deletarCliente(id) {
  if (!confirm("Deseja excluir este cliente?")) return;
  try {
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    showToast("Cliente excluído!", "success");
    carregarClientes();
  } catch (e) {
    showToast("Erro ao excluir cliente", "error");
  }
}

// ===== ADMIN PEDIDOS =====
async function carregarPedidos() {
  try {
    const res = await fetch("/api/pedidos");
    const pedidos = await res.json();
    document.getElementById("tbodyPedidos").innerHTML =
      pedidos
        .map(
          (p) => `
      <tr>
        <td style="font-size:11px;color:var(--texto-suave)">${p.rowKey?.substring(0, 8)}...</td>
        <td style="font-size:12px">${p.clienteId?.substring(0, 8)}...</td>
        <td><strong>R$ ${parseFloat(p.total || 0)
          .toFixed(2)
          .replace(".", ",")}</strong></td>
        <td>${p.metodoPagamento || "—"}</td>
        <td>${p.metodoEntrega || "—"}</td>
        <td>
          <select class="select-status" onchange="atualizarStatus('${p.rowKey}',this.value)">
            ${["confirmado", "enviado", "entregue", "cancelado"]
              .map(
                (s) =>
                  `<option value="${s}" ${p.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`,
              )
              .join("")}
          </select>
        </td>
        <td style="font-size:12px">${p.criadoEm ? new Date(p.criadoEm).toLocaleDateString("pt-BR") : "—"}</td>
        <td>
          <button class="btn-delete" onclick="deletarPedido('${p.rowKey}')">🗑</button>
        </td>
      </tr>
    `,
        )
        .join("") ||
      '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--texto-suave)">Nenhum pedido encontrado</td></tr>';
  } catch (e) {
    console.error(e);
  }
}

async function atualizarStatus(id, status) {
  try {
    await fetch(`/api/pedidos/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast("Status atualizado!", "success");
  } catch (e) {
    showToast("Erro ao atualizar status", "error");
  }
}

async function deletarPedido(id) {
  if (!confirm("Deseja excluir este pedido?")) return;
  try {
    await fetch(`/api/pedidos/${id}`, { method: "DELETE" });
    showToast("Pedido excluído!", "success");
    carregarPedidos();
  } catch (e) {
    showToast("Erro ao excluir pedido", "error");
  }
}

// ===== ÁREA CLIENTE =====
async function buscarAreaCliente() {
  const email = document.getElementById("areaClienteEmail").value;
  if (!email) return;
  try {
    const res = await fetch("/api/clientes");
    const clientes = await res.json();
    const cliente = clientes.find(
      (c) => c.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!cliente) {
      showToast("Cliente não encontrado", "error");
      return;
    }

    document.getElementById("areaClienteData").style.display = "block";
    document.getElementById("areaClienteId").value = cliente.rowKey;
    document.getElementById("acNome").value = cliente.nome || "";
    document.getElementById("acEmail").value = cliente.email || "";
    document.getElementById("acTelefone").value = cliente.telefone || "";
    document.getElementById("acCpf").value = cliente.cpf || "";
    document.getElementById("acEndereco").value = cliente.endereco || "";
    document.getElementById("acCidade").value = cliente.cidade || "";
    document.getElementById("acEstado").value = cliente.estado || "";

    // Load pedidos
    const pedidosRes = await fetch("/api/pedidos");
    const pedidos = await pedidosRes.json();
    const meusPedidos = pedidos.filter((p) => p.clienteId === cliente.rowKey);

    document.getElementById("pedidosCliente").innerHTML = meusPedidos.length
      ? meusPedidos
          .map((p) => {
            const itens =
              typeof p.itens === "string"
                ? JSON.parse(p.itens || "[]")
                : p.itens || [];
            return `
          <div class="pedido-card">
            <div class="pedido-card-header">
              <strong>Pedido #${p.rowKey?.substring(0, 8)}</strong>
              <span class="status-badge status-${p.status}">${p.status}</span>
            </div>
            <p style="font-size:13px;color:var(--texto-suave)">${new Date(p.criadoEm).toLocaleDateString("pt-BR")}</p>
            <p style="font-size:14px;margin-top:6px">${itens.map((i) => `${i.nome} × ${i.quantidade}`).join(", ")}</p>
            <p style="font-size:16px;font-weight:600;margin-top:8px;font-family:'Cormorant Garamond',serif">R$ ${parseFloat(
              p.total || 0,
            )
              .toFixed(2)
              .replace(".", ",")}</p>
          </div>`;
          })
          .join("")
      : '<p style="color:var(--texto-suave);text-align:center;padding:24px">Nenhum pedido encontrado</p>';

    showToast(`Bem-vinda, ${cliente.nome}! 🌸`, "success");
  } catch (e) {
    showToast("Erro ao buscar cliente", "error");
  }
}

function showTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => (t.style.display = "none"));
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById(tabId).style.display = "block";
  event.target.classList.add("active");
}

// ===== FORMS =====
function setupForms() {
  // Produto form
  document
    .getElementById("formProduto")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("produtoId").value;
      const formData = new FormData();
      formData.append("nome", document.getElementById("produtoNome").value);
      formData.append("marca", document.getElementById("produtoMarca").value);
      formData.append("modelo", document.getElementById("produtoModelo").value);
      formData.append(
        "categoria",
        document.getElementById("produtoCategoria").value,
      );
      formData.append("preco", document.getElementById("produtoPreco").value);
      formData.append(
        "quantidade",
        document.getElementById("produtoQtd").value,
      );
      formData.append(
        "descricao",
        document.getElementById("produtoDesc").value,
      );
      const foto = document.getElementById("produtoFoto").files[0];
      if (foto) formData.append("foto", foto);

      try {
        const url = id ? `/api/produtos/${id}` : "/api/produtos";
        const method = id ? "PUT" : "POST";
        const res = await fetch(url, { method, body: formData });
        if (!res.ok) throw new Error((await res.json()).error);

        closeModal("modal-produto");
        showToast(id ? "Produto atualizado!" : "Produto criado! 🌸", "success");
        resetProdutoForm();
        carregarProdutosAdmin();
        carregarProdutosLoja();
      } catch (err) {
        showToast(err.message || "Erro ao salvar produto", "error");
      }
    });

  // Cliente form
  document
    .getElementById("formCliente")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("clienteId").value;
      const body = {
        nome: document.getElementById("clienteNome").value,
        email: document.getElementById("clienteEmail").value,
        telefone: document.getElementById("clienteTelefone").value,
        cpf: document.getElementById("clienteCpf").value,
        endereco: document.getElementById("clienteEndereco").value,
        cidade: document.getElementById("clienteCidade").value,
        estado: document.getElementById("clienteEstado").value,
        cep: document.getElementById("clienteCep").value,
      };

      try {
        const url = id ? `/api/clientes/${id}` : "/api/clientes";
        const method = id ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);

        closeModal("modal-cliente");
        showToast(
          id ? "Cliente atualizado!" : "Cliente cadastrado! 🌸",
          "success",
        );
        resetClienteForm();
        carregarClientes();
      } catch (err) {
        showToast(err.message || "Erro ao salvar cliente", "error");
      }
    });

  // Editar cliente (área cliente)
  document
    .getElementById("formEditarCliente")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("areaClienteId").value;
      const body = {
        nome: document.getElementById("acNome").value,
        email: document.getElementById("acEmail").value,
        telefone: document.getElementById("acTelefone").value,
        cpf: document.getElementById("acCpf").value,
        endereco: document.getElementById("acEndereco").value,
        cidade: document.getElementById("acCidade").value,
        estado: document.getElementById("acEstado").value,
      };
      try {
        await fetch(`/api/clientes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        showToast("Dados atualizados!", "success");
      } catch (e) {
        showToast("Erro ao atualizar dados", "error");
      }
    });
}

function resetProdutoForm() {
  document.getElementById("produtoId").value = "";
  document.getElementById("formProduto").reset();
  document.getElementById("fotoPreview").style.display = "none";
  document.getElementById("uploadPlaceholder").style.display = "flex";
  document.getElementById("modalProdutoTitle").textContent = "Novo Produto";
}

function resetClienteForm() {
  document.getElementById("clienteId").value = "";
  document.getElementById("formCliente").reset();
  document.getElementById("modalClienteTitle").textContent = "Novo Cliente";
}

// ===== IMAGE PREVIEW =====
function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("fotoPreview").src = e.target.result;
    document.getElementById("fotoPreview").style.display = "block";
    document.getElementById("uploadPlaceholder").style.display = "none";
  };
  reader.readAsDataURL(file);
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

// Close modal on overlay click
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
});

// ===== TOAST =====
function showToast(msg, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3500);
}

// ===== FUNÇÕES AUXILIARES DE PRODUTO =====
async function editarProduto(id) {
  const raw = produtosCache.find((p) => (p.rowKey || p.RowKey) === id);
  if (!raw) return;
  const p = normalizarProduto(raw);

  document.getElementById("produtoId").value = p.rowKey;
  document.getElementById("produtoNome").value = p.nome;
  document.getElementById("produtoMarca").value = p.marca;
  document.getElementById("produtoModelo").value = p.modelo;
  document.getElementById("produtoCategoria").value = p.categoria;
  document.getElementById("produtoPreco").value = p.preco;
  document.getElementById("produtoQtd").value = p.quantidade;
  document.getElementById("produtoDesc").value = p.descricao;

  if (p.fotoUrl) {
    document.getElementById("fotoPreview").src = p.fotoUrl;
    document.getElementById("fotoPreview").style.display = "block";
    document.getElementById("uploadPlaceholder").style.display = "none";
  }

  document.getElementById("modalProdutoTitle").textContent = "Editar Produto";
  openModal("modal-produto");
}

async function deletarProduto(id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;
  try {
    const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Produto removido com sucesso!", "success");
      carregarProdutosLoja();
      carregarProdutosAdmin();
    }
  } catch (e) {
    showToast("Erro ao excluir produto", "error");
  }
}
