const BASE_URL = 'https://api-padaria-seven.vercel.app';
const container = document.querySelector('.box-container');
const searchInput = document.querySelector('.search--box input');
const modal = document.getElementById('itemModal');
const closeBtn = modal.querySelector('.close');

let cardapio = []; // aqui vamos guardar os produtos da API

// Função para buscar produtos da API
async function carregarCardapio() {
  try {
    const response = await fetch(`${BASE_URL}/produtos`);
    cardapio = await response.json();
    renderizarCardapio(cardapio);
  } catch (error) {
    console.error('Erro ao carregar cardápio:', error);
  }
}

// Função para renderizar os produtos
function renderizarCardapio(produtos) {
  container.innerHTML = ''; // limpa o container

  produtos.forEach(produto => {
    const box = document.createElement('div');
    box.className = 'box';
    const estoqueTexto = produto.qtd_estoque > 0 ? 'Em estoque' : 'Fora de estoque';
    const estoqueClasse = produto.qtd_estoque > 0 ? 'em-estoque' : 'fora-estoque';

    box.innerHTML = `
      <div class="icons">
        <a href="#" class="fas fa-shopping-cart btn-cart" data-id="${produto.id}" ${produto.qtd_estoque > 0 ? '' : 'style="pointer-events:none; opacity:0.5;"'}></a>
        <a href="#" class="fas fa-heart btn-fav" data-id="${produto.id}"></a>
        <a href="#" class="fas fa-eye btn-view" data-id="${produto.id}"></a>
      </div>
      <div class="image">
        <img src="${produto.imagem}" alt="${produto.nome}">
      </div>
      <div class="content">
        <h3>${produto.nome}</h3>
        <div class="stars">
          <i class="fas fa-star"></i><i class="fas fa-star"></i>
          <i class="fas fa-star"></i><i class="fas fa-star"></i>
          <i class="fas fa-star-half-alt"></i>
        </div>
        <div class="price">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
        <div class="estoque ${estoqueClasse}">${estoqueTexto}</div>
      </div>
    `;
    container.appendChild(box);
  });
}

// Eventos do container (favoritos, carrinho, modal)
container.addEventListener('click', e => {
  const id = parseInt(e.target.dataset.id);
  if (id) return;

  if (e.target.classList.contains('btn-fav')) toggleFavorito(id, e.target);
  if (e.target.classList.contains('btn-cart')) adicionarCarrinho(id);
  if (e.target.classList.contains('btn-view')) abrirModal(id);
});

// Busca em tempo real
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.toLowerCase();
  const boxes = document.querySelectorAll('.box');

  boxes.forEach(box => {
    const productName = box.querySelector('.content h3').textContent.toLowerCase();
    box.style.display = productName.includes(searchTerm) ? 'block' : 'none';
  });
});

// Funções auxiliares

function toggleFavorito(id, heartIcon) {
  let favs = JSON.parse(localStorage.getItem('favs')) || [];  
  favs = favs.includes(id) ? favs.filter(i => i !== id) : [...favs, id];
  localStorage.setItem('favs', JSON.stringify(favs));
  
  heartIcon.classList.toggle('favoritado', favs.includes(id));
}

function adicionarCarrinho(id) {
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const produto = cardapio.find(p => p.id === id);
  if (!produto) return;
  
  const item = carrinho.find(p => p.id === id);
  item ? item.quantidade++ : carrinho.push({ id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, quantidade: 1 });
  
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  alert('Adicionado ao carrinho!');
}

function abrirModal(id) {
  const produto = cardapio.find(p => p.id === id);
  if (!produto) return;

  document.getElementById('modal-img').src = produto.imagem;
  document.getElementById('modal-nome').textContent = produto.nome;
  document.getElementById('modal-desc').textContent = produto.descricao;
  document.getElementById('modal-preco').textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

  const avaliacoes = Array.from({ length: 5 }).map(() => Math.random() * 5 + 5);
  const media = (avaliacoes.reduce((a,b)=>a+b,0)/avaliacoes.length).toFixed(1);
  document.getElementById('modal-avaliacao').textContent = `Média de avaliação: ${media} / 10`;

  modal.style.display = 'block';
}

// Fechar modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => e.target === modal && (modal.style.display = 'none');

// Inicializa
carregarCardapio();
