document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://api-padaria-seven.vercel.app';
    const container = document.querySelector('.box-container' );
    const searchInput = document.querySelector('.search--box input');
    const modal = document.getElementById('itemModal');
    const closeBtn = modal.querySelector('.close');
    const cartButtonHeader = document.querySelector('.cart-button');
    let cardapio = [];

    async function carregarCardapio() {
        try {
            const response = await fetch(`${BASE_URL}/produtos`);
            if (!response.ok) throw new Error('Falha ao carregar produtos');
            cardapio = await response.json();
            renderizarCardapio(cardapio);
        } catch (error) {
            container.innerHTML = '<p style="color: white; text-align: center;">Não foi possível carregar o cardápio.</p>';
        }
    }

    // Filters state
    const filtros = {
        estoque: 'all', // 'all' | 'disponivel' | 'indisponivel'
        busca: ''
    };

    function aplicarFiltros() {
        let produtosFiltrados = cardapio.slice();
        const busca = filtros.busca.toLowerCase().trim();
        if (busca) {
            produtosFiltrados = produtosFiltrados.filter(p => (p.nome || '').toLowerCase().includes(busca));
        }
        if (filtros.estoque === 'disponivel') {
            produtosFiltrados = produtosFiltrados.filter(p => Number(p.qtd_estoque) > 0);
        } else if (filtros.estoque === 'indisponivel') {
            produtosFiltrados = produtosFiltrados.filter(p => Number(p.qtd_estoque) <= 0 || p.qtd_estoque === undefined || p.qtd_estoque === null);
        }
        renderizarCardapio(produtosFiltrados);
    }

    function renderizarCardapio(produtos) {
        container.innerHTML = '';
        produtos.forEach(produto => {
            const box = document.createElement('div');
            box.className = 'box';
            box.dataset.id = produto.produto_id; 
            
            const estoqueTexto = produto.qtd_estoque > 0 ? 'Em estoque' : 'Fora de estoque';
            const estoqueClasse = produto.qtd_estoque > 0 ? 'em-estoque' : 'fora-estoque';

            box.innerHTML = `
                <div class="icons">
                    <a href="#" class="fas fa-shopping-cart btn-cart" ${produto.qtd_estoque > 0 ? '' : 'style="pointer-events:none; opacity:0.5;"'}></a>
                    <a href="#" class="fas fa-heart btn-fav"></a>
                    <a href="#" class="fas fa-eye btn-view"></a>
                </div>
                <div class="image"><img src="${produto.imagem}" alt="${produto.nome}"></div>
                <div class="content">
                    <h3>${produto.nome}</h3>
                    <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></div>
                    <div class="price">R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</div>
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
            const id = icon.closest('.box').dataset.id;
            favs.push(parseInt(id, 10));
        });
        localStorage.setItem('favs', JSON.stringify(favs));
    }

    function atualizarIconesFavoritos() {
        const favs = JSON.parse(localStorage.getItem('favs')) || [];
        document.querySelectorAll('.box').forEach(box => {
            const id = parseInt(box.dataset.id, 10);
            const favIcon = box.querySelector('.btn-fav');
            if (favs.includes(id)) {
                favIcon.classList.add('favoritado');
            } else {
                favIcon.classList.remove('favoritado');
            }
        });
    }

    function abrirModal(id) {
        const produto = cardapio.find(p => p.produto_id === id);
        if (!produto) return;
        document.getElementById('modal-img').src = produto.imagem;
        document.getElementById('modal-nome').textContent = produto.nome;
        document.getElementById('modal-desc').textContent = produto.descricao;
        document.getElementById('modal-preco').textContent = `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`;
        modal.style.display = 'block';
    }

    container.addEventListener('click', e => {
        const box = e.target.closest('.box');
        if (!box) return;
        const id = parseInt(box.dataset.id, 10);
        if (isNaN(id)) return;

        if (e.target.classList.contains('btn-cart')) {
            e.preventDefault();
            const produto = cardapio.find(p => p.produto_id === id);
            if (produto) {
                adicionarItemAoCarrinho(produto);
            }
        } else if (e.target.classList.contains('btn-fav')) {
            e.preventDefault();
            toggleFavorito(id, e.target);
        } else if (e.target.classList.contains('btn-view')) {
            e.preventDefault();
            abrirModal(id);
        }
    });

    if (cartButtonHeader) {
        cartButtonHeader.addEventListener('click', abrirCarrinho);
    }
    // Search input integrates with filtros.busca and reapplies filters
    searchInput.addEventListener('input', () => {
        filtros.busca = searchInput.value || '';
        aplicarFiltros();
    });

    // Filter buttons (Todos / Disponível / Indisponível)
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            if (f === 'all') filtros.estoque = 'all';
            else if (f === 'disponivel') filtros.estoque = 'disponivel';
            else if (f === 'indisponivel') filtros.estoque = 'indisponivel';
            aplicarFiltros();
        });
    });
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = e => {
        if (e.target === modal) modal.style.display = 'none';
    };

    carregarCardapio();
});
