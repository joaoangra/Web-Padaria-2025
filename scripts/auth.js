document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userMenuContainer = document.querySelector('.header ul');

    if (!token || !userMenuContainer) {
        return;
    }

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
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            criarMenuUsuario(JSON.parse(userDataString));
            return; 
        }

        try {
            const response = await fetch('https://api-padaria-seven.vercel.app/clientes', {
                headers: { 'Authorization': `Bearer ${token}` }
            } );

            if (!response.ok) throw new Error('Sessão inválida ou expirada.');

            const todosClientes = await response.json();
            
            const payload = JSON.parse(atob(token.split('.')[1]));
            const clienteLogadoId = payload.cliente_id || payload.id || payload.userId;

            const userData = todosClientes.find(c => c.cliente_id === clienteLogadoId);

            if (userData) {
                localStorage.setItem('userData', JSON.stringify(userData)); 
                criarMenuUsuario(userData); 
            } else {
                throw new Error('Usuário não encontrado na base de dados.');
            }
        } catch (error) {
            console.error("Erro de autenticação:", error.message);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    };

    verificarLogin();
});


