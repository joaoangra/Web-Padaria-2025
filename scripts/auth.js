document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userMenuContainer = document.querySelector('.header ul');

    // Se não há token ou o container do menu não existir, não faz nada.
    if (!token || !userMenuContainer) {
        return;
    }

    // Se o usuário ESTÁ LOGADO, modifica o menu.
    
    // Encontra e remove o link de "Cadastro & Login"
    const loginLink = Array.from(userMenuContainer.querySelectorAll('li a')).find(a => 
        a.getAttribute('href').includes('cadastro.html')
    );
    if (loginLink) {
        loginLink.parentElement.remove();
    }

    // Cria o menu do usuário com as opções que você pediu
    const userMenuHTML = `
        <li class="user-menu">
            <a href="#" class="user-welcome">Minha Conta <i class="fas fa-cog"></i></a>
            <ul class="dropdown-menu">
                <li><a href="/web/perfil.html">Meu Perfil</a></li>
                <li><a href="/web/perfil.html#options">Opções</a></li>
                <li><a href="#" id="logout-button">Sair</a></li>
            </ul>
        </li>
    `;
    userMenuContainer.insertAdjacentHTML('beforeend', userMenuHTML);

    // Adiciona o evento de clique para o botão de logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData'); // Limpa por segurança
            
            alert("Você saiu da sua conta.");
            
            window.location.href = "/web/cadastro.html";
        });
    }
});
