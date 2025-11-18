document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const messageDiv = document.getElementById("message");

  // Observação: A API foi atualizada — o login agora usa email + senha e a
  // resposta contém um campo `tipo` que indica se o usuário é 'admin' ou 'cliente'.
  // Esta função envia { email, senha } e redireciona baseado em `tipo`.
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      messageDiv.textContent = "Por favor, preencha todos os campos!";
      messageDiv.style.color = "var(--error-color)";
      return;
    }

    try {
      const BASE_URL = "https://api-padaria-seven.vercel.app";

      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Credenciais inválidas. Tente novamente.");
      }

  // Salva token e dados do usuário (se retornados)
  localStorage.setItem("authToken", data.token);
  // A API pode retornar os dados do usuário em data.user ou em data
  let userObj = data.user || data || {};
  localStorage.setItem("userData", JSON.stringify(userObj || {}));

      messageDiv.textContent = "Login bem-sucedido! Redirecionando...";
      messageDiv.style.color = "var(--success-color)";

      // Verifica o campo 'tipo' (ex.: vindo da tabela TipoUsuario). Procura por vários nomes
      let tipo = (userObj && (userObj.tipo || userObj.TipoUsuario || userObj.tipoUsuario || userObj.type || userObj.role || userObj.cargo)) || null;

      // Se não veio o tipo na resposta do /login, tenta buscar informações do usuário
      if (!tipo) {
        // Função utilitária para tentar extrair o payload do JWT
        const parseJwt = (t) => {
          try {
            const base64Url = t.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
          } catch (err) { return null; }
        };

        try {
          const payload = parseJwt(data.token);
          const clienteId = payload && (payload.cliente_id || payload.clienteId || payload.id || payload.userId || payload.sub);

          // endpoints que vamos tentar (ordem): por id, /cliente, /cliente/me, /clientes/me, fallback por email
          const tryEndpoints = [];
          if (clienteId) tryEndpoints.push(`${BASE_URL}/clientes/${clienteId}`);
          tryEndpoints.push(`${BASE_URL}/cliente`);
          tryEndpoints.push(`${BASE_URL}/cliente/me`);
          tryEndpoints.push(`${BASE_URL}/clientes/me`);
          tryEndpoints.push(`${BASE_URL}/clientes?email=${encodeURIComponent(email)}`);

          for (const ep of tryEndpoints) {
            try {
              const headers = { "Content-Type": "application/json" };
              if (data.token && !ep.includes('?email=')) headers.Authorization = `Bearer ${data.token}`;
              const resp = await fetch(ep, { headers });
              if (!resp.ok) continue;
              const d = await resp.json();
              const candidate = d.client || d.cliente || d.user || d || {};
              if (candidate && Object.keys(candidate).length) {
                userObj = candidate;
                localStorage.setItem("userData", JSON.stringify(userObj || {}));
              }

              // tenta extrair o tipo em várias formas
              tipo = candidate.tipo || candidate.TipoUsuario || candidate.tipoUsuario || candidate.type || candidate.role || candidate.cargo || null;
              if (!tipo && candidate.tipoUsuario && typeof candidate.tipoUsuario === 'object') {
                tipo = candidate.tipoUsuario.nome || candidate.tipoUsuario.tipo || null;
              }
              if (!tipo && candidate.TipoUsuario && typeof candidate.TipoUsuario === 'object') {
                tipo = candidate.TipoUsuario.nome || candidate.TipoUsuario.tipo || null;
              }

              // se tipo for um id numérico, tenta buscar o registro de TipoUsuario
              if (!tipo && (candidate.tipoUsuarioId || candidate.TipoUsuarioId || candidate.tipo_usuario_id)) {
                const tipoId = candidate.tipoUsuarioId || candidate.TipoUsuarioId || candidate.tipo_usuario_id;
                try {
                  const tipoResp = await fetch(`${BASE_URL}/tipousuario/${tipoId}`, { headers: { "Authorization": `Bearer ${data.token}`, "Content-Type": "application/json" } });
                  if (tipoResp.ok) {
                    const tipoData = await tipoResp.json();
                    const tipoObj = tipoData.tipo || tipoData || {};
                    tipo = tipoObj.nome || tipoObj.nomeTipo || tipoObj.tipo || null;
                  }
                } catch (err) {
                  console.warn('Não foi possível buscar TipoUsuario por id:', err.message || err);
                }
              }

              if (tipo) break;
            } catch (err) {
              console.warn('Erro ao tentar endpoint', ep, err.message || err);
            }
          }
        } catch (e) {
          console.warn('Erro ao tentar recuperar TipoUsuario via /clientes ou endpoints relacionados:', e.message || e);
        }
      }

      // Normaliza o tipo para comparação segura e valida contra o enum do Prisma: enum Tipo { Admin, Comum }
      const tipoNorm = tipo ? String(tipo).toLowerCase() : null;

      // Mapeia variações (por exemplo: 'administrador', 'adm', 'admin') para os valores canônicos
      let tipoCanon = null;
      if (tipoNorm) {
        if (tipoNorm.includes('adm')) tipoCanon = 'admin';
        else if (tipoNorm.includes('com') || tipoNorm.includes('cli')) tipoCanon = 'comum';
        else if (tipoNorm === 'admin' || tipoNorm === 'comum') tipoCanon = tipoNorm;
      }

      // Debug: logar valores para ajudar a identificar por que um admin pode estar sendo tratado como comum
      console.debug('Login: tipo raw=', tipo, 'tipoNorm=', tipoNorm, 'tipoCanon=', tipoCanon, 'userObj=', userObj);

      // Se não conseguiu mapear para 'admin' ou 'comum', bloqueia o acesso
      if (!tipoCanon) {
        console.warn('Tipo de usuário não corresponde ao enum esperado:', tipo);
        // Remove credenciais locais por segurança
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        messageDiv.textContent = 'Tipo de usuário inválido. Contate o administrador.';
        messageDiv.style.color = 'var(--error-color)';
        return;
      }

      setTimeout(() => {
        if (tipoCanon === 'admin') {
          // Usuário administrador -> pasta do admin
          window.location.href = "../Web-Adm-2025/admin/dashboard.html";
        } else {
          // Padrão: usuário comum -> site normal
          window.location.href = "../web/Home.html";
        }
      }, 1200);

    } catch (error) {
      console.error("Erro no login:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      messageDiv.textContent = error.message || "Erro ao realizar login.";
      messageDiv.style.color = "var(--error-color)";
    }
  });
});
