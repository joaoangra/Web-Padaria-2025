// Estado do carrinho, lido do localStorage
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function atualizarCarrinhoUI() {
    const container = document.getElementById("carrinho-itens");
    const footer = document.querySelector('.carrinho-footer');
    const totalDiv = document.getElementById("carrinho-total");
    if (!container || !footer || !totalDiv) return;

    container.innerHTML = "";
    if (carrinho.length === 0) {
        container.innerHTML = '<p>Seu carrinho está vazio.</p>';
        footer.style.display = 'none';
        return;
    }

    footer.style.display = 'block';
    let total = 0;
    carrinho.forEach(produto => {
        const subtotal = produto.preco * produto.quantidade;
        total += subtotal;
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("item-carrinho");
      
        itemDiv.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">
            <div class="item-info">
                <p><strong>${produto.nome}</strong></p>
                <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
                <div class="quantidade-controls">
                    <button onclick="alterarQuantidade(${produto.produto_id}, -1)">−</button>
                    <span>${produto.quantidade}</span>
                    <button onclick="alterarQuantidade(${produto.produto_id}, 1)">+</button>
                    <button class="remover-item-btn" onclick="removerItem(${produto.produto_id})">🗑️</button>
                </div>
                <p><em>Subtotal: R$ ${subtotal.toFixed(2)}</em></p>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
    totalDiv.innerHTML = `Total: R$ ${total.toFixed(2)}`;
}

function abrirCarrinho() {
    const sidebar = document.getElementById("carrinhoSidebar");
    if (sidebar) {
        sidebar.classList.add("aberta");
        atualizarCarrinhoUI();
    }
}

function fecharCarrinho() {
    const sidebar = document.getElementById("carrinhoSidebar");
    if (sidebar) sidebar.classList.remove("aberta");
}

function adicionarItemAoCarrinho(produto) {
    const itemExistente = carrinho.find(item => item.produto_id === produto.produto_id);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        produto.quantidade = 1;
        carrinho.push(produto);
    }
    salvarCarrinho();
    abrirCarrinho();
}

function alterarQuantidade(produto_id, delta) {
    const item = carrinho.find(i => i.produto_id === produto_id);
    if (item) {
        item.quantidade += delta;
        if (item.quantidade <= 0) {
            carrinho = carrinho.filter(i => i.produto_id !== produto_id);
        }
        salvarCarrinho();
        // A função abaixo redesenha o carrinho inteiro com a nova quantidade
        atualizarCarrinhoUI();
    }
}

function removerItem(produto_id) {
    carrinho = carrinho.filter(i => i.produto_id !== produto_id);
    salvarCarrinho();
    atualizarCarrinhoUI();
}

function finalizarPedido() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }
    window.location.href = "/web/checkout.html";
}

document.addEventListener('DOMContentLoaded', () => {
    const fecharBtn = document.querySelector('#carrinhoSidebar .fechar-btn');
    if (fecharBtn) fecharBtn.addEventListener('click', fecharCarrinho);

    const finalizarBtn = document.querySelector('#carrinhoSidebar .finalizar');
    if (finalizarBtn) finalizarBtn.addEventListener('click', finalizarPedido);
    
    atualizarCarrinhoUI();
});
