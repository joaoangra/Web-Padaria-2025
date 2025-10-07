// Em /scripts/faleConosco.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona o formulário pelo ID que vamos adicionar no HTML
    const form = document.getElementById('form-contato');

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // Impede o comportamento padrão de recarregar a página

        const submitButton = form.querySelector('input[type="submit"]');
        const statusMessage = document.createElement('p'); // Cria um elemento para mensagens
        statusMessage.className = 'status-message';
        form.appendChild(statusMessage);

        // Pega os dados do formulário
        const formData = new FormData(form);
        
        // Feedback visual para o usuário
        submitButton.value = 'Enviando...';
        submitButton.disabled = true;
        statusMessage.textContent = '';

        try {
            // Envia os dados para o endpoint do Formspree
            const response = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Processa a resposta
            if (response.ok) {
                statusMessage.textContent = 'Mensagem enviada com sucesso! Obrigado.';
                statusMessage.style.color = 'green';
                form.reset(); // Limpa os campos do formulário
            } else {
                // Tenta pegar uma mensagem de erro mais específica do Formspree
                const data = await response.json();
                if (Object.hasOwn(data, 'errors')) {
                    statusMessage.textContent = data["errors"].map(error => error["message"]).join(", ");
                } else {
                    statusMessage.textContent = 'Ocorreu um erro ao enviar a mensagem.';
                }
                statusMessage.style.color = 'red';
            }
        } catch (error) {
            statusMessage.textContent = 'Falha na conexão. Verifique sua internet e tente novamente.';
            statusMessage.style.color = 'red';
        } finally {
            // Restaura o botão
            submitButton.value = 'Enviar';
            submitButton.disabled = false;

            // Remove a mensagem de status após alguns segundos
            setTimeout(() => {
                statusMessage.remove();
            }, 6000);
        }
    });
});
