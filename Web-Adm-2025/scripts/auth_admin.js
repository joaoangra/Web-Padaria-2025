document.addEventListener('DOMContentLoaded', () => {
    // A lógica de autenticação principal é tratada em auth.js
    const userMenuContainer = document.querySelector('.header ul');

    // Set active nav link for admin pages
    const setActiveNav = () => {
        const links = document.querySelectorAll('.header .nav-link, .header ul li a');
        links.forEach(a => {
            try {
                const href = a.getAttribute('href');
                if (!href) return;
                if (window.location.href.includes(href)) a.classList.add('active');
            } catch (e) {}
        });
    };
    setActiveNav();

    if (!userMenuContainer) return;

    const criarMenuUsuario = (user) => {
        if (!user || !user.nome) {
            console.error("Dados do usuário inválidos, não foi possível criar o menu.");
            return;
        }

        const loginLink = Array.from(userMenuContainer.querySelectorAll('li a')).find(a => 
            a.getAttribute('href').includes('cadastro.html')
        );
        
        if (loginLink) {
            loginLink.parentElement.remove();
        }

        const userMenuHTML = `
            <li class="user-menu">
                <a href="#" class="user-welcome">Olá, ${user.nome.split(' ')[0]} <i class="fas fa-cog"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="../web/perfil.html">Meu Perfil</a></li>
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
                alert("Você saiu da sua conta.");
                window.location.href = "../web/cadastro.html";
            });
        }
    };

    const verificarLogin = async () => {
            // A lógica de autenticação principal é tratada em auth.js, que é carregado no HTML.
        // Este arquivo só precisa garantir que o menu seja criado se o usuário estiver logado.
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            criarMenuUsuario(JSON.parse(userDataString));
        } else {
            // Se não houver dados, o auth.js já tentou validar o token.
            // Se o usuário estiver em uma página de admin sem login, ele será redirecionado pelo admin.js
        }
    };

    // A função verificarLogin de auth.js é chamada no DOMContentLoaded,
    // então não precisamos chamá-la aqui.
    // Apenas garantimos que o menu seja criado se os dados estiverem no localStorage.
    // verificarLogin();
});

