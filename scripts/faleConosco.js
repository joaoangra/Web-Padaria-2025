document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('form-contato');

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const submitButton = form.querySelector('input[type="submit"]');
        const statusMessage = document.createElement('p');
        statusMessage.className = 'status-message';
        form.appendChild(statusMessage);

        const formData = new FormData(form);

        submitButton.value = 'Enviando...';
        submitButton.disabled = true;
        statusMessage.textContent = '';

        try {
            // Converte os dados do formulário para um objeto simples
            const formData = new FormData(form);
            const dataObject = Object.fromEntries(formData.entries());

            // Envia os dados para o endpoint do Formspree como JSON
            const response = await fetch(form.action, {
                method: form.method,
                body: JSON.stringify(dataObject), // CORREÇÃO: Envia como JSON
                headers: {
                    'Content-Type': 'application/json', // CORREÇÃO: Informa que o corpo é JSON
                    'Accept': 'application/json'
                }
            });

            // Processa a resposta (o resto do código continua igual)
            if (response.ok) {
                statusMessage.textContent = 'Mensagem enviada com sucesso! Obrigado.';
                statusMessage.style.color = 'green';
                form.reset();
            } else {
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
    })
});