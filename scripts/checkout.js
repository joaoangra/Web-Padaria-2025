let carrinho = [];
let timerInterval;
let pixProcessed = false;

document.addEventListener('DOMContentLoaded', function() {
    carregarCarrinho();
    configurarEventListeners();
    configurarMascaras();
    validarFormulario();
});

function carregarCarrinho() {
    const carrinhoStorage = localStorage.getItem('carrinho');
    if (carrinhoStorage) {
        carrinho = JSON.parse(carrinhoStorage);
        carrinho.forEach(item => {
            item.total = item.preco * item.quantidade;
        });
    } else {
        carrinho = [];
    }
    atualizarResumo();
}

function atualizarResumo() {
    const resumoItens = document.getElementById('resumo-itens');
    const subtotalEl = document.getElementById('subtotal');
    const totalFinalEl = document.getElementById('total-final');

    let subtotal = 0;
    let html = '';

    carrinho.forEach(item => {
        subtotal += item.total;
        html += `
            <div class="item-resumo">
                <span>${item.quantidade}x ${item.nome}</span>
                <span>R$ ${item.total.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    });

    const recebimento = document.querySelector('input[name="recebimento"]:checked');
    const taxaEntrega = (recebimento && recebimento.value === 'retirada') ? 0.00 : 5.00;
    const total = subtotal + taxaEntrega;

    resumoItens.innerHTML = html;
    subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    totalFinalEl.innerHTML = `<strong>R$ ${total.toFixed(2).replace('.', ',')}</strong>`;
}

function configurarEventListeners() {
    const recebimentoOptions = document.querySelectorAll('input[name="recebimento"]');
    recebimentoOptions.forEach(option => {
        option.addEventListener('change', function() {
            mostrarEndereco(this.value);
            atualizarResumo();
        });
    });

    const paymentOptions = document.querySelectorAll('input[name="pagamento"]');
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            mostrarFormularioPagamento(this.value);
        });
    });

    document.getElementById('btn-finalizar').addEventListener('click', finalizarPedido);

    document.getElementById('btn-copiar-pix').addEventListener('click', copiarCodigoPix);

    document.getElementById('btn-novo-pedido').addEventListener('click', function() {
        window.location.href = 'cardapio.html';
    });

    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', validarFormulario);
        input.addEventListener('blur', validarFormulario);
    });
}

function configurarMascaras() {
    document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = value;
    });
    
    document.getElementById('cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });
    
    document.getElementById('cep').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
    
    document.getElementById('numero-cartao').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value;
    });
    
    document.getElementById('validade').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/, '$1/$2');
        e.target.value = value;
    });
    
    document.getElementById('cvv').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

function mostrarFormularioPagamento(tipo) {
    document.getElementById('cartao-form').style.display = 'none';
    document.getElementById('dinheiro-form').style.display = 'none';

    if (tipo === 'cartao') {
        document.getElementById('cartao-form').style.display = 'block';
    } else if (tipo === 'dinheiro') {
        document.getElementById('dinheiro-form').style.display = 'block';
    }

    validarFormulario();
}

function mostrarEndereco(tipo) {
    const enderecoSection = document.getElementById('section-endereco');
    const enderecoInputs = enderecoSection.querySelectorAll('input');

    if (tipo === 'retirada') {
        enderecoSection.style.display = 'none';
        enderecoInputs.forEach(input => {
            input.required = false;
            input.value = '';
        });
    } else {
        enderecoSection.style.display = 'block';
        enderecoInputs.forEach(input => {
            input.required = true;
        });
    }

    validarFormulario();
}

function validarFormulario() {
    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email = document.getElementById('email').value.trim();
    const recebimento = document.querySelector('input[name="recebimento"]:checked');
    const pagamento = document.querySelector('input[name="pagamento"]:checked');

    let isValid = nome && telefone && email && recebimento && pagamento;

    // Address validation only for delivery
    if (recebimento && recebimento.value === 'entrega') {
        const cep = document.getElementById('cep').value.trim();
        const rua = document.getElementById('rua').value.trim();
        const numero = document.getElementById('numero').value.trim();
        const bairro = document.getElementById('bairro').value.trim();
        const cidade = document.getElementById('cidade').value.trim();

        isValid = isValid && cep && rua && numero && bairro && cidade;
    }

    if (pagamento && pagamento.value === 'cartao') {
        const numeroCartao = document.getElementById('numero-cartao').value.trim();
        const nomeCartao = document.getElementById('nome-cartao').value.trim();
        const validade = document.getElementById('validade').value.trim();
        const cvv = document.getElementById('cvv').value.trim();

        isValid = isValid && numeroCartao && nomeCartao && validade && cvv;
    }

    document.getElementById('btn-finalizar').disabled = !isValid;
}

async function finalizarPedido() {
    // 1. VERIFICAR LOGIN (ESSENCIAL)
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Você precisa estar logado para finalizar o pedido.");
        window.location.href = "/web/cadastro.html";
        return;
    }

    // 2. COLETAR DADOS DO FORMULÁRIO E DO CARRINHO
    const dadosCliente = {
        nome: document.getElementById('nome').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        email: document.getElementById('email').value.trim(),
        cpf: document.getElementById('cpf').value.trim()
    };

    const dadosEntrega = {
        tipo: document.querySelector('input[name="recebimento"]:checked').value,
        cep: document.getElementById('cep').value.trim(),
        rua: document.getElementById('rua').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        complemento: document.getElementById('complemento').value.trim(),
        bairro: document.getElementById('bairro').value.trim(),
        cidade: document.getElementById('cidade').value.trim()
    };

    const dadosPagamento = {
        forma: document.querySelector('input[name="pagamento"]:checked').value
        // Não envie dados de cartão de crédito para sua API a menos que você
        // tenha certificação PCI. A simulação atual é segura.
    };

    // Prepara os itens do pedido no formato que a API espera
    const itensPedido = carrinho.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco
    }));

    // 3. MONTAR O CORPO DA REQUISIÇÃO PARA A API
    const corpoRequisicao = {
        itens: itensPedido,
        dadosCliente,
        dadosEntrega,
        dadosPagamento
    };

    // Desativa o botão para evitar cliques duplos
    document.getElementById('btn-finalizar').disabled = true;
    document.getElementById('btn-finalizar').textContent = 'Processando...';

    // 4. ENVIAR OS DADOS PARA A API
    try {
        const response = await fetch('https://api-padaria-seven.vercel.app/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Autenticação
            },
            body: JSON.stringify(corpoRequisicao )
        });

        const resultado = await response.json();

        if (response.ok) {
            // SUCESSO! O pedido foi criado no banco de dados.
            localStorage.removeItem('carrinho'); // Limpa o carrinho local
            
            // Agora, podemos chamar a função que mostra a tela de sucesso
            // passando o número do pedido real retornado pela API.
            const mensagemSucesso = dadosEntrega.tipo === 'retirada'
                ? 'Pedido confirmado! Aguarde a confirmação para retirada na loja.'
                : 'Pedido confirmado! Em breve ele sairá para entrega.';
            
            mostrarSucesso(mensagemSucesso, resultado.pedido_id); // Passa o ID do pedido real

        } else {
            // ERRO! A API retornou um problema (ex: falta de estoque).
            alert(`Erro ao finalizar o pedido: ${resultado.error}`);
            // Reativa o botão em caso de erro
            document.getElementById('btn-finalizar').disabled = false;
            document.getElementById('btn-finalizar').textContent = 'Finalizar Pedido';
        }

    } catch (error) {
        console.error("Erro de rede ao finalizar pedido:", error);
        alert("Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.");
        // Reativa o botão em caso de erro de rede
        document.getElementById('btn-finalizar').disabled = false;
        document.getElementById('btn-finalizar').textContent = 'Finalizar Pedido';
    }
}

function processarPagamento(formaPagamento) {
    switch (formaPagamento) {
        case 'cartao':
            processarPagamentoCartao();
            break;
        case 'pix':
            processarPagamentoPix();
            break;
        case 'dinheiro':
            processarPagamentoDinheiro();
            break;
    }
}

function processarPagamentoCartao() {
    mostrarModal('processamento');
    document.getElementById('modal-title').textContent = 'Processando pagamento...';
    document.getElementById('modal-message').textContent = 'Aguarde enquanto processamos seu cartão.';

    setTimeout(() => {
        fecharModal('processamento');
        const recebimento = document.querySelector('input[name="recebimento"]:checked').value;
        const mensagem = recebimento === 'retirada'
            ? 'Pagamento aprovado! Aguarde o pedido para retirada na loja.'
            : 'Pagamento aprovado! Aguarde o pedido em sua residência.';
        mostrarSucesso(mensagem);
    }, 30000);
}

function processarPagamentoPix() {
    mostrarModal('processamento');
    document.getElementById('modal-title').textContent = 'Aprovando pagamento';
    document.getElementById('modal-message').textContent = 'Escaneie o QR Code ou copie o código PIX abaixo:';

    document.getElementById('qr-container').style.display = 'block';
    document.getElementById('timer-container').style.display = 'block';

    gerarQRCode();

    iniciarTimer(600);

    setTimeout(() => {
        if (!pixProcessed) {
            pixProcessed = true;
            clearInterval(timerInterval);
            fecharModal('processamento');
            const recebimento = document.querySelector('input[name="recebimento"]:checked').value;
            const mensagem = recebimento === 'retirada'
                ? 'Pagamento aprovado! Aguarde o pedido para retirada na loja.'
                : 'Pagamento aprovado! Aguarde o pedido em sua residência.';
            mostrarSucesso(mensagem);
        }
    }, 15000);
}

function processarPagamentoDinheiro() {
    const recebimento = document.querySelector('input[name="recebimento"]:checked').value;
    const mensagem = recebimento === 'retirada'
        ? 'Pagamento aprovado! Aguarde o pedido para retirada na loja.<br><strong>Pague na retirada.</strong>'
        : 'Pagamento aprovado! Aguarde o pedido em sua residência.<br><strong>Pague ao motoboy na entrega.</strong>';
    mostrarSucesso(mensagem);
}

function gerarQRCode() {
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 200;
    
    ctx.fillStyle = '#000000';
    
    const size = 10;
    const pattern = [
        [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1,0,0,1,0,0,1,1,1,0,1],
        [1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1],
        [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [1,0,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1],
        [0,1,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0],
        [1,1,1,0,0,1,1,1,0,1,1,1,0,0,0,1,1],
        [0,0,0,1,1,0,0,0,1,0,0,0,1,1,1,0,0],
        [1,0,1,0,0,1,1,1,0,1,1,1,0,0,0,1,1],
        [0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0],
        [1,1,1,1,1,1,1,0,0,1,1,1,0,1,0,1,1],
        [1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0],
        [1,0,1,1,1,0,1,0,0,1,1,1,0,0,0,1,1]
    ];
    
    for (let i = 0; i < pattern.length; i++) {
        for (let j = 0; j < pattern[i].length; j++) {
            if (pattern[i][j] === 1) {
                ctx.fillRect(j * size, i * size, size, size);
            }
        }
    }
}

function iniciarTimer(segundos) {
    let tempoRestante = segundos;
    
    timerInterval = setInterval(() => {
        const minutos = Math.floor(tempoRestante / 60);
        const segs = tempoRestante % 60;
        
        document.getElementById('timer-display').textContent = 
            `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
        
        tempoRestante--;
        
        if (tempoRestante < 0) {
            clearInterval(timerInterval);
            if (!pixProcessed) {
                fecharModal('processamento');
                alert('Tempo esgotado! Tente novamente.');
            }
        }
    }, 1000);
}

function copiarCodigoPix() {
    const codigo = document.getElementById('pix-code-text').textContent;
    
    navigator.clipboard.writeText(codigo).then(() => {
        const btn = document.getElementById('btn-copiar-pix');
        const textoOriginal = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.style.background = '#28a745';
        
        setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.style.background = '#28a745';
        }, 2000);
        
        setTimeout(() => {
            if (!pixProcessed) {
                pixProcessed = true;
                clearInterval(timerInterval);
                fecharModal('processamento');
                mostrarSucesso('Pagamento aprovado! Aguarde o pedido em sua residência.');
            }
        }, 15000);
    }).catch(() => {
        alert('Erro ao copiar código. Tente selecionar e copiar manualmente.');
    });
}

function mostrarModal(tipo) {
    document.getElementById(`modal-${tipo}`).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function fecharModal(tipo) {
    document.getElementById(`modal-${tipo}`).style.display = 'none';
    document.body.style.overflow = 'auto';
}


function mostrarSucesso(mensagem, numeroPedido) { // Adiciona o parâmetro numeroPedido
    document.getElementById('success-message').innerHTML = mensagem;
    // Usa o número do pedido vindo da API em vez de um aleatório
    document.getElementById('numero-pedido').textContent = numeroPedido || (Math.floor(Math.random() * 90000) + 10000);
    mostrarModal('sucesso');
}

document.getElementById('cep').addEventListener('blur', function() {
    const cep = this.value.replace(/\D/g, '');
    
    if (cep.length === 8) {
        setTimeout(() => {
            document.getElementById('rua').value = 'Rua das Flores';
            document.getElementById('bairro').value = 'Centro';
            document.getElementById('cidade').value = 'São Paulo';
            validarFormulario();
        }, 500);
    }
});

const style = document.createElement('style');
style.textContent = `
    .item-resumo {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 14px;
    }
    
    .item-resumo:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);
