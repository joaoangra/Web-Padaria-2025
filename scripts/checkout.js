let carrinho = [];
let timerInterval;
let pixProcessed = false;

document.addEventListener("DOMContentLoaded", function() {
    inicializarCheckout();
});

function inicializarCheckout() {
    preencherDadosDoUsuarioLogado();
    carregarCarrinho();
    configurarEventListeners();
    configurarMascaras();
    validarFormulario();
}


function preencherDadosDoUsuarioLogado() {
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) return;
    const userData = JSON.parse(userDataString);
    document.getElementById('nome').value = userData.nome || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('telefone').value = userData.telefone || '';
    document.getElementById('rua').value = userData.endereco || '';
}

function carregarCarrinho() {
    const carrinhoStorage = localStorage.getItem("carrinho");
    carrinho = carrinhoStorage ? JSON.parse(carrinhoStorage) : [];
    carrinho.forEach(item => item.total = item.preco * item.quantidade);
    atualizarResumo();
}

function atualizarResumo() {
    const resumoItens = document.getElementById("resumo-itens");
    const subtotalEl = document.getElementById("subtotal");
    const totalFinalEl = document.getElementById("total-final");
    const taxaEntregaEl = document.getElementById("taxa-entrega");

    if (!resumoItens || !subtotalEl || !totalFinalEl || !taxaEntregaEl) return;

    let subtotal = carrinho.reduce((acc, item) => acc + item.total, 0);
    resumoItens.innerHTML = carrinho.map(item => `
        <div class="item-resumo">
            <span>${item.quantidade}x ${item.nome}</span>
            <span>R$ ${item.total.toFixed(2).replace(".", ",")}</span>
        </div>
    `).join('');

    const entregaSelecionada = document.getElementById('entrega').checked;
    const taxaEntrega = entregaSelecionada ? 5.00 : 0.00;
    const total = subtotal + taxaEntrega;

    subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
    taxaEntregaEl.textContent = `R$ ${taxaEntrega.toFixed(2).replace(".", ",")}`;
    totalFinalEl.innerHTML = `<strong>R$ ${total.toFixed(2).replace(".", ",")}</strong>`;
}

function validarFormulario() {
    const btnFinalizar = document.getElementById('btn-finalizar');
    let isFormValid = true;

    const dadosPessoaisInputs = document.querySelectorAll('#checkout-form input[required]');
    for (const input of dadosPessoaisInputs) {
        if (!input.value.trim()) isFormValid = false;
    }

    if (document.getElementById('entrega').checked) {
        const enderecoInputs = document.querySelectorAll('#section-endereco input[required]');
        for (const input of enderecoInputs) {
            if (!input.value.trim()) isFormValid = false;
        }
    }

    const pagamentoSelecionado = document.querySelector("input[name='pagamento']:checked");
    if (!pagamentoSelecionado) {
        isFormValid = false;
    } else if (pagamentoSelecionado.value === 'cartao') {
        const cartaoInputs = document.querySelectorAll('#cartao-form input');
        for (const input of cartaoInputs) {
            if (!input.value.trim()) isFormValid = false;
        }
    }

    btnFinalizar.disabled = !isFormValid;
}


function configurarEventListeners() {
    document.querySelectorAll('.checkout-content input').forEach(input => input.addEventListener('input', validarFormulario));
    document.querySelectorAll("input[name='recebimento']").forEach(option => {
        option.addEventListener("change", () => {
            mostrarEndereco(option.value);
            atualizarResumo();
            validarFormulario();
        });
    });
    document.querySelectorAll("input[name='pagamento']").forEach(option => {
        option.addEventListener("change", () => {
            mostrarFormularioPagamento(option.value);
            validarFormulario();
        });
    });
    document.getElementById("btn-finalizar").addEventListener("click", finalizarPedido);
    document.getElementById("btn-copiar-pix").addEventListener("click", copiarCodigoPix);
    document.getElementById("btn-novo-pedido").addEventListener("click", () => window.location.href = "cardapio.html");
}

function configurarMascaras() {
    const masks = {
        telefone: value => value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2"),
        cpf: value => value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
        cep: value => value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2"),
        "numero-cartao": value => value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 "),
        validade: value => value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1/$2"),
        cvv: value => value.replace(/\D/g, "")
    };
    Object.keys(masks).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", e => e.target.value = masks[id](e.target.value));
    });
}


function finalizarPedido() {
    const formaPagamento = document.querySelector("input[name='pagamento']:checked").value;
    processarPagamento(formaPagamento);
}

function processarPagamento(formaPagamento) {
    switch (formaPagamento) {
        case "cartao":
            processarPagamentoCartao();
            break;
        case "pix":
            processarPagamentoPix();
            break;
        case "dinheiro":
            processarPagamentoDinheiro();
            break;
    }
}

async function processarPagamentoCartao() {
    mostrarModal("processamento");
    document.getElementById("modal-title").textContent = "Processando pagamento...";
    document.getElementById("modal-message").textContent = "Aguarde enquanto validamos seu cartão.";
    
    setTimeout(async () => {
        try {
            const dadosDoPedido = coletarDadosDoPedido("Cartao");
            if (!dadosDoPedido) return; // Se não houver cliente_id, parar o processo
            await enviarPedidoParaAPI(dadosDoPedido);
            console.log("Pedido (Cartão) enviado para API (simulado).");

            fecharModal("processamento");
            localStorage.removeItem("carrinho");
            const msg = document.getElementById('entrega').checked ? "Pagamento aprovado! Aguarde o pedido em sua residência." : "Pagamento aprovado! Aguarde o pedido para retirada na loja.";
            mostrarSucesso(msg);
        } catch (error) {
            fecharModal("processamento");
            alert("Houve um erro ao processar seu pagamento. Tente novamente.");
        }
    }, 3000);
}

async function processarPagamentoPix() {
    pixProcessed = false;
    mostrarModal("processamento");
    document.getElementById("modal-title").textContent = "Aguardando Pagamento PIX";
    document.getElementById("modal-message").textContent = "Escaneie o QR Code ou copie o código abaixo:";
    document.getElementById("qr-container").style.display = "block";
    document.getElementById("timer-container").style.display = "block";

    gerarQRCode();
    iniciarTimer(600); // 10 minutos

    setTimeout(async () => {
        if (pixProcessed) return;
        pixProcessed = true;
        clearInterval(timerInterval);

        try {
            const dadosDoPedido = coletarDadosDoPedido("Pix");
            if (!dadosDoPedido) return; // Se não houver cliente_id, parar o processo
            await enviarPedidoParaAPI(dadosDoPedido);
            console.log("Pedido (PIX) enviado para API (simulado).");

            fecharModal("processamento");
            localStorage.removeItem("carrinho");
            const msg = document.getElementById('entrega').checked ? "Pagamento aprovado! Aguarde o pedido em sua residência." : "Pagamento aprovado! Aguarde o pedido para retirada na loja.";
            mostrarSucesso(msg);
        } catch (error) {
            fecharModal("processamento");
        }
    }, 15000); // Simula confirmação após 15 segundos
}

async function processarPagamentoDinheiro() {
    try {
        const dadosDoPedido = coletarDadosDoPedido("Dinheiro");
        if (!dadosDoPedido) return; // Se não houver cliente_id, parar o processo
        await enviarPedidoParaAPI(dadosDoPedido);
        console.log("Pedido (Dinheiro) enviado para API (simulado).");

        localStorage.removeItem("carrinho");
        const msg = document.getElementById('entrega').checked ? "Pedido confirmado! Pague ao motoboy na entrega." : "Pedido confirmado! Pague na retirada na loja.";
        mostrarSucesso(msg);
    } catch (error) {
        alert("Houve um erro ao finalizar seu pedido. Tente novamente.");
    }
}

function mostrarEndereco(tipo) {
    const enderecoSection = document.getElementById("section-endereco");
    if (!enderecoSection) return;
    const inputs = enderecoSection.querySelectorAll("input");
    if (tipo === "retirada") {
        enderecoSection.style.display = "none";
        inputs.forEach(input => input.required = false);
    } else {
        enderecoSection.style.display = "block";
        inputs.forEach(input => {
            if (['cep', 'rua', 'numero', 'bairro', 'cidade'].includes(input.id)) {
                input.required = true;
            }
        });
    }
}

function mostrarFormularioPagamento(tipo) {
    document.getElementById("cartao-form").style.display = "none";
    document.getElementById("dinheiro-form").style.display = "none";
    if (tipo === "cartao") document.getElementById("cartao-form").style.display = "block";
    if (tipo === "dinheiro") document.getElementById("dinheiro-form").style.display = "block";
}

function gerarQRCode() {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = 150; canvas.height = 150;
    ctx.fillStyle = "#FFF"; ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = "#000";
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (Math.random() > 0.5) ctx.fillRect(j * 10, i * 10, 10, 10);
        }
    }
}

function iniciarTimer(segundos) {
    let tempoRestante = segundos;
    const display = document.getElementById("timer-display");
    if (!display) return;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const minutos = Math.floor(tempoRestante / 60);
        const segs = tempoRestante % 60;
        display.textContent = `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
        tempoRestante--;
        if (tempoRestante < 0) {
            clearInterval(timerInterval);
            if (!pixProcessed) {
                fecharModal("processamento");
                alert("Tempo para pagamento PIX esgotado! Por favor, tente novamente.");
            }
        }
    }, 1000);
}

function copiarCodigoPix() {
    const codigo = document.getElementById("pix-code-text").textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        const btn = document.getElementById("btn-copiar-pix");
        btn.textContent = "Copiado!";
        btn.style.background = "#28a745";
        setTimeout(() => {
            btn.textContent = "Copiar Código";
            btn.style.background = ""; 
        }, 2000);
    }).catch(() => alert("Erro ao copiar código."));
}

function mostrarModal(tipo) { document.getElementById(`modal-${tipo}`).style.display = "flex"; }
function fecharModal(tipo) { document.getElementById(`modal-${tipo}`).style.display = "none"; }
function mostrarSucesso(mensagem) {
    document.getElementById("success-message").innerHTML = mensagem;
    document.getElementById("numero-pedido").textContent = Math.floor(Math.random() * 90000) + 10000;
    mostrarModal("sucesso");
}

const style = document.createElement("style");
style.textContent = `.item-resumo { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 1.4rem; } .item-resumo:last-child { border-bottom: none; }`;
document.head.appendChild(style);



function coletarDadosDoPedido(formaPagamento) {
    const userDataString = localStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : {};

    const cliente_id = userData.cliente_id; 
    if (!cliente_id) {
        console.error("Cliente ID não encontrado. O usuário precisa estar logado.");
        alert("Por favor, faça login para finalizar o pedido.");
        return null;
    }

    const isEntrega = document.getElementById('entrega').checked;
    const enderecoEntrega = isEntrega ? {
        rua: document.getElementById('rua').value,
        numero: document.getElementById('numero').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        cep: document.getElementById('cep').value,
        complemento: document.getElementById('complemento').value || null
    } : null;

    const itensPedido = carrinho.map(item => ({
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        
    }));

    const subtotal = carrinho.reduce((acc, item) => acc + item.total, 0);
    const taxaEntrega = isEntrega ? 5.00 : 0.00;
    const totalFinal = subtotal + taxaEntrega;

    return {
        cliente_id: cliente_id,
        data: new Date().toISOString(), // Data atual do pedido
        sub_total: subtotal,
        forma_pagamento: formaPagamento,
        total_final: totalFinal, // Adicionando total_final para ser enviado
        itens: itensPedido,
        endereco_entrega: enderecoEntrega // Incluir endereço de entrega se for entrega
    };
}




async function enviarPedidoParaAPI(dadosDoPedido) {
    try {
        const response = await fetch("https://api-padaria-seven.vercel.app/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dadosDoPedido),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao enviar pedido para a API.");
        }

        const result = await response.json();
        console.log("Pedido enviado com sucesso:", result);
        return result;
    } catch (error) {
        console.error("Erro na função enviarPedidoParaAPI:", error);
        throw error;
    }
}

if (!localStorage.getItem('userData')) {
    const testUserData = {
        cliente_id: 1, 
        nome: 'Cliente Teste',
        email: 'teste@example.com',
        telefone: '(11) 98765-4321',
        endereco: 'Rua Teste, 123'
    };
    localStorage.setItem('userData', JSON.stringify(testUserData));
}

