
let carrinho = [];
let timerInterval;
let pixProcessed = false;


document.addEventListener("DOMContentLoaded", function() {
    carregarCarrinho();
    configurarEventListeners();
    configurarMascaras();
    validarFormulario();
});

function carregarCarrinho() {
    const carrinhoStorage = localStorage.getItem("carrinho");
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
    const resumoItens = document.getElementById("resumo-itens");
    const subtotalEl = document.getElementById("subtotal");
    const totalFinalEl = document.getElementById("total-final");

    let subtotal = 0;
    let html = "";

    carrinho.forEach(item => {
        subtotal += item.total;
        html += `
            <div class=\"item-resumo\">
                <span>${item.quantidade}x ${item.nome}</span>
                <span>R$ ${item.total.toFixed(2).replace(".", ",")}</span>
            </div>
        `;
    });

    const recebimento = document.querySelector("input[name=\"recebimento\"]:checked");
    const taxaEntrega = (recebimento && recebimento.value === "retirada") ? 0.00 : 5.00;
    const total = subtotal + taxaEntrega;

    resumoItens.innerHTML = html;
    subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
    totalFinalEl.innerHTML = `<strong>R$ ${total.toFixed(2).replace(".", ",")}</strong>`;
}

function configurarEventListeners() {
    const recebimentoOptions = document.querySelectorAll("input[name=\"recebimento\"]");
    recebimentoOptions.forEach(option => {
        option.addEventListener("change", function() {
            mostrarEndereco(this.value);
            atualizarResumo();
        });
    });

    const paymentOptions = document.querySelectorAll("input[name=\"pagamento\"]");
    paymentOptions.forEach(option => {
        option.addEventListener("change", function() {
            mostrarFormularioPagamento(this.value);
        });
    });

    document.getElementById("btn-finalizar").addEventListener("click", finalizarPedido);

    document.getElementById("btn-copiar-pix").addEventListener("click", copiarCodigoPix);

    document.getElementById("btn-novo-pedido").addEventListener("click", function() {
        window.location.href = "cardapio.html";
    });

    const inputs = document.querySelectorAll("input[required]");
    inputs.forEach(input => {
        input.addEventListener("input", validarFormulario);
        input.addEventListener("blur", validarFormulario);
    });
}

function configurarMascaras() {
    document.getElementById("telefone").addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d)(\d{4})$/, "$1-$2");
        e.target.value = value;
    });
    
    document.getElementById("cpf").addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = value;
    });
    
    document.getElementById("cep").addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/^(\d{5})(\d)/, "$1-$2");
        e.target.value = value;
    });
    
    document.getElementById("numero-cartao").addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
        e.target.value = value;
    });
    
    document.getElementById("validade").addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d)/, "$1/$2");
        e.target.value = value;
    });
    
    document.getElementById("cvv").addEventListener("input", function(e) {
        e.target.value = e.target.value.replace(/\D/g, "");
    });
}

function mostrarFormularioPagamento(tipo) {
    document.getElementById("cartao-form").style.display = "none";
    document.getElementById("dinheiro-form").style.display = "none";

    if (tipo === "cartao") {
        document.getElementById("cartao-form").style.display = "block";
    } else if (tipo === "dinheiro") {
        document.getElementById("dinheiro-form").style.display = "block";
    }

    validarFormulario();
}

function mostrarEndereco(tipo) {
    const enderecoSection = document.getElementById("section-endereco");
    
    // Adiciona uma verificação para garantir que o elemento existe antes de tentar manipulá-lo
    if (!enderecoSection) {
        console.warn("Elemento #section-endereco não encontrado no DOM.");
        return; // Sai da função se o elemento não for encontrado
    }

    const enderecoInputs = enderecoSection.querySelectorAll("input");

    if (tipo === "retirada") {
        enderecoSection.style.display = "none";
        enderecoInputs.forEach(input => {
            input.required = false;
            input.value = "";
        });
    } else {
        enderecoSection.style.display = "block";
        enderecoInputs.forEach(input => {
            input.required = true;
        });
    }

    validarFormulario();
}

function validarFormulario() {
    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();
    const recebimento = document.querySelector("input[name=\"recebimento\"]:checked");
    const pagamento = document.querySelector("input[name=\"pagamento\"]:checked");

    let isValid = nome && telefone && email && recebimento && pagamento;

    // Address validation only for delivery
    if (recebimento && recebimento.value === "entrega") {
        const cep = document.getElementById("cep").value.trim();
        const rua = document.getElementById("rua").value.trim();
        const numero = document.getElementById("numero").value.trim();
        const bairro = document.getElementById("bairro").value.trim();
        const cidade = document.getElementById("cidade").value.trim();

        isValid = isValid && cep && rua && numero && bairro && cidade;
    }

    if (pagamento && pagamento.value === "cartao") {
        const numeroCartao = document.getElementById("numero-cartao").value.trim();
        const nomeCartao = document.getElementById("nome-cartao").value.trim();
        const validade = document.getElementById("validade").value.trim();
        const cvv = document.getElementById("cvv").value.trim();

        isValid = isValid && numeroCartao && nomeCartao && validade && cvv;
    }

    document.getElementById("btn-finalizar").disabled = !isValid;
}

function finalizarPedido() {
    const formaPagamento = document.querySelector("input[name=\"pagamento\"]:checked").value;

    // Não limpe o carrinho aqui ainda. Limpe apenas após o sucesso do envio para a API.
    // localStorage.removeItem("carrinho");

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

// --- INÍCIO DA SEÇÃO DE INTEGRAÇÃO COM A API ---

/**
 * Função para enviar os dados do pedido para a API Vercel.
 * @param {object} dadosParaEnviar - O objeto completo com os dados do pedido.
 */
async function enviarPedidoParaAPI(dadosParaEnviar) {
    const urlApi = "https://api-padaria-seven.vercel.app/pedidos";

    try {
        const response = await fetch(urlApi, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Se no futuro precisar de autenticação, adicione aqui:
                // "Authorization": "Bearer SEU_TOKEN_AQUI"
            },
            body: JSON.stringify(dadosParaEnviar)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
            throw new Error(`Erro HTTP! Status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const resultado = await response.json();
        console.log("Pedido enviado com sucesso:", resultado);
        return resultado; // Retorna a resposta da API em caso de sucesso

    } catch (error) {
        console.error("Erro ao enviar pedido para a API:", error);
        alert(`Não foi possível finalizar o pedido. Por favor, tente novamente. Detalhes: ${error.message}`);
        throw error; // Re-lança o erro para que a função chamadora possa lidar com ele
    }
}

/**
 * Coleta todos os dados do formulário e do carrinho para montar o objeto do pedido.
 * @param {string} formaPagamento - A forma de pagamento escolhida.
 * @returns {object} - O objeto com os dados do pedido para enviar à API.
 */
function coletarDadosDoPedido(formaPagamento) {
    // Usando um cliente_id fixo para teste, já que não há uma forma de obtê-lo no frontend no momento.
    // Em um ambiente de produção, este valor viria do usuário logado.
    const clienteId = 1; // ID de cliente fixo para teste

    const itensDoPedido = carrinho.map(item => ({
        produto_id: Number(item.id), // Garante que produto_id é um número
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco)
    }));

    return {
        cliente_id: clienteId,
        forma_pagamento: formaPagamento,
        itens: itensDoPedido
        // Adicione aqui outros campos se sua API precisar, como dados do cliente, endereço, etc.
    };
}

// --- FIM DA SEÇÃO DE INTEGRAÇÃO COM A API ---


async function processarPagamentoCartao() {
    mostrarModal("processamento");
    document.getElementById("modal-title").textContent = "Processando pagamento...";
    document.getElementById("modal-message").textContent = "Aguarde enquanto processamos seu cartão.";

    // Simula um tempo de processamento do cartão
    setTimeout(async () => {
        try {
            const dadosDoPedido = coletarDadosDoPedido("Cartao");
            const resultadoApi = await enviarPedidoParaAPI(dadosDoPedido);

            // Se chegou aqui, o pedido foi enviado com sucesso
            fecharModal("processamento");
            localStorage.removeItem("carrinho"); // Limpa o carrinho após o sucesso
            if (typeof mostrarCarrinhoSidebar === "function") {
                mostrarCarrinhoSidebar();
            }

            const recebimento = document.querySelector("input[name=\"recebimento\"]:checked").value;
            const mensagem = recebimento === "retirada"
                ? "Pagamento aprovado! Aguarde o pedido para retirada na loja."
                : "Pagamento aprovado! Aguarde o pedido em sua residência.";
            mostrarSucesso(mensagem);

        } catch (error) {
            // O erro já é exibido por um alert em `enviarPedidoParaAPI`
            fecharModal("processamento");
            console.error("Falha ao processar pagamento com cartão e enviar pedido.", error);
        }
    }, 3000); // Simulação de 3 segundos para processar o cartão
}

async function processarPagamentoPix() {
    mostrarModal("processamento");
    document.getElementById("modal-title").textContent = "Aprovando pagamento";
    document.getElementById("modal-message").textContent = "Escaneie o QR Code ou copie o código PIX abaixo:";

    document.getElementById("qr-container").style.display = "block";
    document.getElementById("timer-container").style.display = "block";

    gerarQRCode();
    iniciarTimer(600);

    // Simulação de confirmação de pagamento PIX e envio para API
    setTimeout(async () => {
        if (!pixProcessed) {
            pixProcessed = true;
            clearInterval(timerInterval);

            try {
                const dadosDoPedido = coletarDadosDoPedido("Pix");
                const resultadoApi = await enviarPedidoParaAPI(dadosDoPedido);

                fecharModal("processamento");
                localStorage.removeItem("carrinho"); // Limpa o carrinho após o sucesso
                if (typeof mostrarCarrinhoSidebar === "function") {
                    mostrarCarrinhoSidebar();
                }

                const recebimento = document.querySelector("input[name=\"recebimento\"]:checked").value;
                const mensagem = recebimento === "retirada"
                    ? "Pagamento aprovado! Aguarde o pedido para retirada na loja."
                    : "Pagamento aprovado! Aguarde o pedido em sua residência.";
                mostrarSucesso(mensagem);

            } catch (error) {
                fecharModal("processamento");
                console.error("Falha ao processar pagamento com PIX e enviar pedido.", error);
            }
        }
    }, 15000); // Simulação de 15 segundos para confirmar o PIX
}

async function processarPagamentoDinheiro() {
    try {
        const dadosDoPedido = coletarDadosDoPedido("Dinheiro");
        const resultadoApi = await enviarPedidoParaAPI(dadosDoPedido);

        localStorage.removeItem("carrinho"); // Limpa o carrinho após o sucesso
        if (typeof mostrarCarrinhoSidebar === "function") {
            mostrarCarrinhoSidebar();
        }

        const recebimento = document.querySelector("input[name=\"recebimento\"]:checked").value;
        const mensagem = recebimento === "retirada"
            ? "Pagamento aprovado! Aguarde o pedido para retirada na loja.<br><strong>Pague na retirada.</strong>"
            : "Pagamento aprovado! Aguarde o pedido em sua residência.<br><strong>Pague ao motoboy na entrega.</strong>";
        mostrarSucesso(mensagem);

    } catch (error) {
        console.error("Falha ao processar pagamento em dinheiro e enviar pedido.", error);
    }
}

function gerarQRCode() {
    const canvas = document.getElementById("qr-canvas");
    const ctx = canvas.getContext("2d");
    
    canvas.width = 200;
    canvas.height = 200;
    
    ctx.fillStyle = "#000000";
    
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
        
        document.getElementById("timer-display").textContent = 
            `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
        
        tempoRestante--;
        
        if (tempoRestante < 0) {
            clearInterval(timerInterval);
            if (!pixProcessed) {
                fecharModal("processamento");
                alert("Tempo esgotado! Tente novamente.");
            }
        }
    }, 1000);
}

function copiarCodigoPix() {
    const codigo = document.getElementById("pix-code-text").textContent;
    
    navigator.clipboard.writeText(codigo).then(() => {
        const btn = document.getElementById("btn-copiar-pix");
        const textoOriginal = btn.textContent;
        btn.textContent = "Copiado!";
        btn.style.background = "#28a745";
        
        setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.style.background = "#28a745";
        }, 2000);
        
        // Removido o envio automático para a API daqui. O envio agora é feito em processarPagamentoPix.

    }).catch(() => {
        alert("Erro ao copiar código. Tente selecionar e copiar manualmente.");
    });
}

function mostrarModal(tipo) {
    document.getElementById(`modal-${tipo}`).style.display = "flex";
    document.body.style.overflow = "hidden";
}

function fecharModal(tipo) {
    document.getElementById(`modal-${tipo}`).style.display = "none";
    document.body.style.overflow = "auto";
}

function mostrarSucesso(mensagem) {
    document.getElementById("success-message").innerHTML = mensagem;
    // O número do pedido agora deve vir da resposta da API
    // document.getElementById("numero-pedido").textContent = Math.floor(Math.random() * 90000) + 10000;
    mostrarModal("sucesso");
}

document.getElementById("cep").addEventListener("blur", function() {
    const cep = this.value.replace(/\D/g, "");
    
    if (cep.length === 8) {
        setTimeout(() => {
            document.getElementById("rua").value = "Rua das Flores";
            document.getElementById("bairro").value = "Centro";
            document.getElementById("cidade").value = "São Paulo";
            validarFormulario();
        }, 500);
    }
});

const style = document.createElement("style");
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

