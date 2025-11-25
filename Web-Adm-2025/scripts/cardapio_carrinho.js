// ==========================================================================
// Lógica de Visualização do Cardápio e Carrinho de Compras
// ==========================================================================

const BASE_URL = 'https://api-padaria-seven.vercel.app';
let cardapio = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

// ==========================================================================
// FUNÇÕES DO CARRINHO
// ==========================================================================

function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function atualizarCarrinhoUI() {
    const container = document.getElementById("carrinho-itens");
    const footer = document.querySelector('.carrinho-footer');
    const totalDiv = document.getElementById("carrinho-total");
    const contadorCarrinho = document.querySelector('.cart-contador');

    if (!container || !footer || !totalDiv) return;

    // 1. Atualiza o contador no header
    if (contadorCarrinho) {
        const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
        contadorCarrinho.textContent = totalItens;
        contadorCarrinho.classList.toggle('hidden', totalItens === 0);
    }

    // 2. Renderiza os itens na sidebar
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
        
        // Formatação de moeda
        const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ',');
        const subtotalFormatado = subtotal.toFixed(2).replace('.', ',');

        itemDiv.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">
            <div class="item-info">
                <p><strong>${produto.nome}</strong></p>
                <p>Preço: R$ ${precoFormatado}</p>
                <div class="quantidade-controls">
                    <button class="btn-qty-minus" data-id="${produto.produto_id}">−</button>
                    <span>${produto.quantidade}</span>
                    <button class="btn-qty-plus" data-id="${produto.produto_id}">+</button>
                    <button class="remover-item-btn" data-id="${produto.produto_id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <p><em>Subtotal: R$ ${subtotalFormatado}</em></p>
            </div>
        `;
        container.appendChild(itemDiv);
    });
    
    // 3. Atualiza o total
    totalDiv.innerHTML = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
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
    const id = parseInt(produto_id, 10);
    const item = carrinho.find(i => i.produto_id === id);
    if (item) {
        item.quantidade += delta;
        if (item.quantidade <= 0) {
            carrinho = carrinho.filter(i => i.produto_id !== id);
        }
        salvarCarrinho();
        atualizarCarrinhoUI();
    }
}

function removerItem(produto_id) {
    const id = parseInt(produto_id, 10);
    carrinho = carrinho.filter(i => i.produto_id !== id);
    salvarCarrinho();
    atualizarCarrinhoUI();
}

async function finalizarPedido() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        alert("Você precisa estar logado para finalizar a compra.");
        // Redireciona para a página de login/cadastro
        window.location.href = "cadastro.html"; 
        return;
    }

    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }

    // 1. Prepara os dados do pedido
    const itensPedido = carrinho.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco
    }));

    const pedidoData = {
        cliente_id: JSON.parse(localStorage.getItem('userData')).id, // Assumindo que o ID do cliente está no userData
        itens: itensPedido,
        // Adicionar outros campos necessários como endereço, forma de pagamento, etc.
    };

    try {
        const response = await fetch(`${BASE_URL}/pedidos`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(pedidoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao finalizar o pedido.');
        }

        // Limpa o carrinho e notifica o usuário
        carrinho = [];
        salvarCarrinho();
        atualizarCarrinhoUI();
        fecharCarrinho();
        alert('Pedido realizado com sucesso! Você será redirecionado para a página de acompanhamento.');
        
        // Redireciona para a página de acompanhamento de pedidos (se existir)
        window.location.href = "pedidos.html"; 

    } catch (error) {
        alert('Erro ao finalizar pedido: ' + error.message);
        console.error('Erro de pedido:', error);
    }

}

// ==========================================================================
// FUNÇÕES DO CARDÁPIO
// ==========================================================================

async function carregarCardapio() {
    const container = document.querySelector('.box-container');
    if (!container) return;

    try {
        const response = await fetch(`${BASE_URL}/produtos`);
        if (!response.ok) throw new Error('Falha ao carregar produtos');
        cardapio = await response.json();
        renderizarCardapio(cardapio);
    } catch (error) {
        container.innerHTML = '<p style="color: var(--text-dark); text-align: center; font-size: 1.6rem;">Não foi possível carregar o cardápio. Tente novamente mais tarde.</p>';
    }
}

function renderizarCardapio(produtos) {
    const container = document.querySelector('.box-container');
    if (!container) return;

    container.innerHTML = '';
    produtos.forEach(produto => {
        const box = document.createElement('div');
        box.className = 'box';
        box.dataset.id = produto.produto_id; 
        
        const estoqueTexto = produto.qtd_estoque > 0 ? 'Em estoque' : 'Fora de estoque';
        const estoqueClasse = produto.qtd_estoque > 0 ? 'em-estoque' : 'fora-estoque';
        const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ',');

        box.innerHTML = `
            <div class="icons">
                <a href="#" class="fas fa-shopping-cart btn-cart" data-id="${produto.produto_id}" ${produto.qtd_estoque > 0 ? '' : 'style="pointer-events:none; opacity:0.5;"'}></a>
                <a href="#" class="fas fa-heart btn-fav" data-id="${produto.produto_id}"></a>
                <a href="#" class="fas fa-eye btn-view" data-id="${produto.produto_id}"></a>
            </div>
            <div class="image"><img src="${produto.imagem}" alt="${produto.nome}"></div>
            <div class="content">
                <h3>${produto.nome}</h3>
                <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></div>
                <div class="price">R$ ${precoFormatado}</div>
                <div class="estoque ${estoqueClasse}">${estoqueTexto}</div>
            </div>
        `;
        container.appendChild(box);
    });
    atualizarIconesFavoritos();
}

function toggleFavorito(id, heartIcon) {
    heartIcon.classList.toggle('favoritado');
    salvarFavoritos();
}

function salvarFavoritos() {
    const favs = [];
    document.querySelectorAll('.btn-fav.favoritado').forEach(icon => {
        const id = icon.dataset.id;
        favs.push(parseInt(id, 10));
    });
    localStorage.setItem('favs', JSON.stringify(favs));
}

function atualizarIconesFavoritos() {
    const favs = JSON.parse(localStorage.getItem('favs')) || [];
    document.querySelectorAll('.btn-fav').forEach(favIcon => {
        const id = parseInt(favIcon.dataset.id, 10);
        if (favs.includes(id)) {
            favIcon.classList.add('favoritado');
        } else {
            favIcon.classList.remove('favoritado');
        }
    });
}

function abrirModal(id) {
    const produto = cardapio.find(p => p.produto_id === id);
    const modal = document.getElementById('itemModal');
    const btnCartModal = modal.querySelector('.btn-modal-cart');

    if (!produto || !modal) return;

    document.getElementById('modal-img').src = produto.imagem;
    document.getElementById('modal-nome').textContent = produto.nome;
    document.getElementById('modal-desc').textContent = produto.descricao;
    document.getElementById('modal-preco').textContent = `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`;
    
    // Atualiza o botão de adicionar ao carrinho no modal
    btnCartModal.dataset.id = produto.produto_id;
    if (produto.qtd_estoque > 0) {
        btnCartModal.removeAttribute('disabled');
        btnCartModal.textContent = 'Adicionar ao Carrinho';
    } else {
        btnCartModal.setAttribute('disabled', 'true');
        btnCartModal.textContent = 'Fora de Estoque';
    }

    modal.classList.add('show');
    document.body.classList.add('modal-open'); // Para travar o scroll
}

function fecharModal() {
    const modal = document.getElementById('itemModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Carrega o cardápio ao iniciar
    carregarCardapio();
    atualizarCarrinhoUI();

    // Eventos do Cardápio (Botões de Ação)
    document.querySelector('.box-container')?.addEventListener('click', e => {
        const target = e.target.closest('a, button');
        if (!target) return;
        
        const id = parseInt(target.dataset.id, 10);
        if (isNaN(id)) return;

        if (target.classList.contains('btn-cart')) {
            e.preventDefault();
            const produto = cardapio.find(p => p.produto_id === id);
            if (produto) adicionarItemAoCarrinho(produto);
        } else if (target.classList.contains('btn-fav')) {
            e.preventDefault();
            toggleFavorito(id, target);
        } else if (target.classList.contains('btn-view')) {
            e.preventDefault();
            abrirModal(id);
        }
    });

    // Evento do Modal (Botão Adicionar ao Carrinho)
    document.querySelector('.btn-modal-cart')?.addEventListener('click', e => {
        const id = parseInt(e.target.dataset.id, 10);
        if (isNaN(id)) return;
        const produto = cardapio.find(p => p.produto_id === id);
        if (produto) {
            adicionarItemAoCarrinho(produto);
            fecharModal();
        }
    });

    // Evento do Modal (Fechar)
    document.getElementById('itemModal')?.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) {
            fecharModal();
        }
    });
    document.querySelector('#itemModal .close')?.addEventListener('click', fecharModal);


    // Eventos do Carrinho (Sidebar)
    document.querySelector('.cart-button')?.addEventListener('click', abrirCarrinho);
    document.querySelector('#carrinhoSidebar .fechar-btn')?.addEventListener('click', fecharCarrinho);
    document.querySelector('#carrinhoSidebar .finalizar')?.addEventListener('click', finalizarPedido);

    // Eventos de alteração de quantidade e remoção na sidebar
    document.getElementById('carrinho-itens')?.addEventListener('click', e => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('btn-qty-plus')) {
            alterarQuantidade(id, 1);
        } else if (target.classList.contains('btn-qty-minus')) {
            alterarQuantidade(id, -1);
        } else if (target.classList.contains('remover-item-btn')) {
            removerItem(id);
        }
    });

    // Evento de Busca
    document.querySelector('.search--box input')?.addEventListener('input', e => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const produtosFiltrados = cardapio.filter(p => p.nome.toLowerCase().includes(searchTerm));
        renderizarCardapio(produtosFiltrados);
    });
});

window.adicionarItemAoCarrinho = adicionarItemAoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.removerItem = removerItem;
window.adicionarItemAoCarrinho = adicionarItemAoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.removerItem = removerItem;
// Exporta as funções para serem usadas no HTML (onclick)
window.abrirCarrinho = abrirCarrinho;
window.fecharCarrinho = fecharCarrinho;
window.finalizarPedido = finalizarPedido;
window.fecharModal = fecharModal;
// As funções de alteração de quantidade e remoção são tratadas via event delegation
// mas se o HTML antigo usar onclick, elas precisam estar no escopo global.
// Como o HTML será corrigido, a delegação é preferível.
// Manter no escopo global por segurança:
window.alterarQuantidade = alterarQuantidade;
window.removerItem = removerItem;