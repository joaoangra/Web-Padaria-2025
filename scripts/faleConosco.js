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

            const formData = new FormData(form);
            const dataObject = Object.fromEntries(formData.entries());

            const response = await fetch(form.action, {
                method: form.method,
                body: JSON.stringify(dataObject), 
                headers: {
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json'
                }
            });

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

            submitButton.value = 'Enviar';
            submitButton.disabled = false;

            setTimeout(() => {
                statusMessage.remove();
            }, 6000);

        }
    })
});