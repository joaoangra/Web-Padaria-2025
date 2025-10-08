document.addEventListener("DOMContentLoaded", ( ) => {
  const form = document.getElementById("login-form");
  const messageDiv = document.getElementById("message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
      messageDiv.textContent = "Por favor, preencha todos os campos!";
      messageDiv.style.color = "var(--error-color)";
      return;
    }

    try {
      const response = await fetch("https://api-padaria-seven.vercel.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha } )
      });
      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.removeItem('userData');
        messageDiv.textContent = "Login bem-sucedido! Redirecionando...";
        messageDiv.style.color = "var(--success-color)";
        setTimeout(() => { window.location.href = "/web/Home.html"; }, 1500);
      } else {
        throw new Error(data.error || "Credenciais inválidas. Tente novamente.");
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      messageDiv.textContent = error.message;
      messageDiv.style.color = "var(--error-color)";
    }
  });
});
