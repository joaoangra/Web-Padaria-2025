document.querySelector('.fa-cart-shopping').addEventListener('click', abrirCarrinho);

function abrirCarrinho() {
  const sidebar = document.getElementById("carrinhoSidebar");
  sidebar.classList.add("aberta");
  mostrarCarrinhoSidebar();
}

function fecharCarrinho() {
  const sidebar = document.getElementById("carrinhoSidebar");
  sidebar.classList.remove("aberta");
}

function mostrarCarrinhoSidebar() {
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const container = document.getElementById("carrinho-itens");
  const totalDiv = document.getElementById("carrinho-total");

  container.innerHTML = "";

  if (carrinho.length === 0) {
    container.innerHTML = "<p>Seu carrinho está vazio.</p>";
    totalDiv.innerHTML = "";
    return;
  }

  let total = 0;

  carrinho.forEach((produto, index) => {
    const subtotal = produto.preco * produto.quantidade;
    total += subtotal;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("item-carrinho");
    itemDiv.innerHTML = `
      <img src="${produto.imagem}" alt="${produto.nome}">
      <div class="item-info">
        <p><strong>${produto.nome}</strong></p>
        <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
        <p><em>Subtotal: R$ ${subtotal.toFixed(2)}</em></p>
        <div class="quantidade-controls">
          <button onclick="alterarQuantidade(${index}, -1)">−</button>
          <span>${produto.quantidade}</span>
          <button onclick="alterarQuantidade(${index}, 1)">+</button>
          <button onclick="removerItem(${index})">🗑️</button>
        </div>
      </div>
    `;
    container.appendChild(itemDiv);
  });

  totalDiv.innerHTML = `Total: R$ ${total.toFixed(2)}`;
}

function alterarQuantidade(index, delta) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  carrinho[index].quantidade += delta;
  carrinho[index].quantidade = Math.max(carrinho[index].quantidade, 0);

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  mostrarCarrinhoSidebar();
}

function removerItem(index) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  carrinho.splice(index, 1);

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  mostrarCarrinhoSidebar();
}

function adicionarAoCarrinho(produto) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  const itemExistente = carrinho.find(item => item.id === produto.id);
  if (itemExistente) {
    itemExistente.quantidade += produto.quantidade;
  } else {
    carrinho.push(produto);
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  const sidebar = document.getElementById("carrinhoSidebar");
  if (sidebar.classList.contains("aberta")) {
    mostrarCarrinhoSidebar();
  }
}

function finalizarPedido() {
  try {
    console.log("Navegando para checkout");
    window.location.href = "checkout.html";
  } catch (error) {
    console.error("Erro ao finalizar pedido:", error);
  }
}
