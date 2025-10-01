const BASE_URL = 'https://api-padaria-seven.vercel.app';

fetch(`${BASE_URL}/produtos`)
  .then(res => res.json())
  .then(data => {
    const container = document.querySelector('.box-container');
    container.innerHTML = ''; // Limpa o container

    data.forEach(produto => {
      const produtoDiv = document.createElement('div');
      produtoDiv.classList.add('box');

      // Verifica estoque
      const estoqueClass = produto.estoque > 0 ? 'em-estoque' : 'fora-estoque';
      const estoqueTexto = produto.estoque > 0 ? 'Em Estoque' : 'Fora De Estoque';

      produtoDiv.innerHTML = `
        <div class="icons">
          <a href="#" class="fas fa-shopping-cart"></a>
          <a href="#" class="fas fa-heart"></a>
          <a href="#" class="fas fa-eye" onclick="abrirModal(${produto.id})"></a>
        </div>
        <div class="image">
          <img src="${produto.imagem}" alt="${produto.nome}">
        </div>
        <div class="content">
          <h3>${produto.nome}</h3>
          <div class="stars">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star-half-alt"></i>
          </div>
          <div class="price">R$ ${produto.preco.toFixed(2)}</div>
          <span class="estoque ${estoqueClass}">${estoqueTexto}</span>
        </div>
      `;

      container.appendChild(produtoDiv);
    });
  })
  .catch(error => {
    console.error('Erro ao buscar produtos:', error);
  });