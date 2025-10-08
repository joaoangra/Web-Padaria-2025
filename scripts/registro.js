document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const messageDiv = document.getElementById("message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const telefone = document.getElementById("telefone").value.trim();
        const endereco = document.getElementById("endereco").value.trim();
        const senha = document.getElementById("senha").value;
        const confirmSenha = document.getElementById("confirmSenha").value;

        messageDiv.textContent = ""; // Limpa a mensagem anterior

        if (!nome || !email || !telefone || !endereco || !senha || !confirmSenha) {
            messageDiv.textContent = "Por favor, preencha todos os campos!";
            messageDiv.style.color = "var(--error-color)";
            return;
        }
        if (senha !== confirmSenha) {
            messageDiv.textContent = "As senhas não conferem!";
            messageDiv.style.color = "var(--error-color)";
            return;
        }

        try {
            const res = await fetch("https://api-padaria-seven.vercel.app/clientes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, email, telefone, endereco, senha } )
            });
            const data = await res.json();

            if (res.ok) {
                messageDiv.textContent = "Cadastro realizado com sucesso! Redirecionando para o login...";
                messageDiv.style.color = "var(--success-color)";
                setTimeout(() => { window.location.href = "/web/cadastro.html"; }, 2000);
            } else {
                throw new Error(data.error || "Erro ao realizar o cadastro.");
            }
        } catch (err) {
            messageDiv.textContent = err.message;
            messageDiv.style.color = "var(--error-color)";
        }
    });
});
