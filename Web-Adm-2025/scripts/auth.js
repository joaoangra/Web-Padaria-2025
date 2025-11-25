document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const messageDiv = document.getElementById("message");
  const BASE_URL = "https://api-padaria-seven.vercel.app";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailOuNome = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!emailOuNome || !senha) {
      messageDiv.textContent = "Por favor, preencha todos os campos!";
      messageDiv.style.color = "var(--error-color)";
      return;
    }

    try {
      // Sempre usa o endpoint /login, backend decide baseado no "@"
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailOuNome, senha }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // salva login
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user || {}));

        messageDiv.textContent = "Login bem-sucedido! Redirecionando...";
        messageDiv.style.color = "var(--success-color)";

        setTimeout(() => {
          if (data.user?.cargo === "Administrador" || data.user?.role === "admin") {
            window.location.href = "../Web-Adm-2025/admin/dashboard.html";
          } else {
            window.location.href = "../web/Home.html";
          }
        }, 1500);
      } else {
        throw new Error(data.error || "Credenciais inválidas. Tente novamente.");
      }
    } catch (error) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      messageDiv.textContent = error.message;
      messageDiv.style.color = "var(--error-color)";
    }
  });
});