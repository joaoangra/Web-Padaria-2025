document.addEventListener('DOMContentLoaded', () => {
  try {
    const userDataString = localStorage.getItem('userData');
  const userMenuContainer = document.querySelector('.header ul') || document.querySelector('nav ul') || document.querySelector('.navbar ul');
    if (!userMenuContainer) return;

    // Remove item de login se existir
    const loginLink = Array.from(userMenuContainer.querySelectorAll('li a')).find(a => {
      try { return a.getAttribute('href') && a.getAttribute('href').includes('cadastro.html'); } catch (e) { return false; }
    });

    // calcula paths relativos corretos para os links dependendo da pasta atual
    const pathname = window.location.pathname || '';
    let profileHref = 'perfil.html';
    let loginHref = 'cadastro.html';
    // se estiver nas páginas admin (Web-Adm-2025), ajusta os caminhos para apontar para /web/
    if (pathname.includes('/Web-Adm-2025/') || pathname.includes('/Web-Adm-2025\\')) {
      // use absolute paths so links work from GitHub Pages irrespective of current folder
      profileHref = '/web/perfil.html';
      loginHref = '/web/cadastro.html';
    } else if (pathname.includes('/web/') || pathname.includes('/web\\')) {
      profileHref = 'perfil.html';
      loginHref = 'cadastro.html';
    } else {
      // fallback: tenta ser relativo ao diretório atual
      profileHref = 'perfil.html';
      loginHref = 'cadastro.html';
    }

    if (userDataString) {
      const user = JSON.parse(userDataString);
      if (loginLink) loginLink.parentElement.remove();

      const firstName = (user.nome && user.nome.split && user.nome.split(' ')[0]) || user.email || 'Usuário';

      const userMenuHTML = `
        <li class="user-menu">
          <a href="#" class="user-welcome">Olá, ${firstName} <i class="fas fa-cog"></i></a>
          <ul class="dropdown-menu">
            <li><a href="${profileHref}">Meu Perfil</a></li>
            <li><a href="#" id="logout-button">Sair</a></li>
          </ul>
        </li>
      `;

      userMenuContainer.insertAdjacentHTML('beforeend', userMenuHTML);
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          // volta para a página de login (usando caminho calculado)
          window.location.href = loginHref;
        });
      }

      // Toggle dropdown on click for touch devices; keep hidden by default
      const userMenuEl = userMenuContainer.querySelector('.user-menu');
      const userWelcome = userMenuEl?.querySelector('.user-welcome');
      if (userWelcome && userMenuEl) {
        userWelcome.addEventListener('click', (ev) => {
          ev.preventDefault();
          userMenuEl.classList.toggle('open');
        });
        // close when clicking outside
        document.addEventListener('click', (ev) => {
          if (!userMenuEl.contains(ev.target)) {
            userMenuEl.classList.remove('open');
          }
        });
      }
    } else {
      // se não está logado, garante que o link de cadastro exista
      if (!loginLink) {
        userMenuContainer.insertAdjacentHTML('beforeend', `<li><a href="${loginHref}">Cadastro & Login</a></li>`);
      }
    }
  } catch (err) {
    console.warn('header.js error', err);
  }
});