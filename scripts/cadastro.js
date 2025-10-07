document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await fetch("https://api-padaria-seven.vercel.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha } )
      });

      const data = await response.json();

      // A ÚNICA CONDIÇÃO É A API RETORNAR 'OK' E UM TOKEN
      if (response.ok && data.token) {
        // Apenas salva o token. Nada mais.
        localStorage.setItem('authToken', data.token);
        
        // Limpa qualquer dado de usuário antigo para evitar inconsistências
        localStorage.removeItem('userData'); 
        
        alert("Login realizado com sucesso!");
        window.location.href = "/web/Home.html";
      } else {
        throw new Error(data.error || "Erro ao realizar login. Verifique suas credenciais.");
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      alert(error.message);
      console.error("Falha no processo de login:", error);
    }
  });
});