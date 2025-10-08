// /scripts/faleConosco.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-contato');
    if (!form) return; // Se não achar o formulário, não faz nada.

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        // Cria ou encontra a mensagem de status
        let statusMessage = form.querySelector('.status-message');
        if (!statusMessage) {
            statusMessage = document.createElement('p');
            statusMessage.className = 'status-message';
            // Insere a mensagem depois do botão
            form.querySelector('.btn').insertAdjacentElement('afterend', statusMessage);
            statusMessage.style.marginTop = '1.5rem';
            statusMessage.style.fontSize = '1.6rem';
        }

        const submitButton = form.querySelector('input[type="submit"]');
        const formData = new FormData(form);

        submitButton.value = 'Enviando...';
        submitButton.disabled = true;
        statusMessage.textContent = '';

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                statusMessage.textContent = 'Mensagem enviada com sucesso! Obrigado.';
                statusMessage.style.color = 'var(--main-color)';
                form.reset();
            } else {
                const data = await response.json();
                statusMessage.textContent = data.errors ? data.errors.map(e => e.message).join(', ') : 'Ocorreu um erro ao enviar a mensagem.';
                statusMessage.style.color = '#ff6b6b'; // Vermelho para erro
            }
        } catch (error) {
            statusMessage.textContent = 'Falha na conexão. Tente novamente.';
            statusMessage.style.color = '#ff6b6b';
        } finally {
            submitButton.value = 'Enviar';
            submitButton.disabled = false;

            setTimeout(() => {
                if (statusMessage) statusMessage.textContent = '';
            }, 6000);
        }
    });
});
