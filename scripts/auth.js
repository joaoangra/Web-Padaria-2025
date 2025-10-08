document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userMenuContainer = document.querySelector('.header ul');

    // Se não houver token ou o container do menu não existir, não faz nada.
    if (!token || !userMenuContainer) {
        return;
    }

    // Função para criar o menu do usuário na tela
    const criarMenuUsuario = (user) => {
        // Garante que temos um nome de usuário antes de continuar
        if (!user || !user.nome) {
            console.error("Dados do usuário inválidos, não foi possível criar o menu.");
            return;
        }

        // Encontra e remove o link de "Cadastro & Login"
        const loginLink = Array.from(userMenuContainer.querySelectorAll('li a')).find(a => 
            a.getAttribute('href').includes('cadastro.html')
        );
        if (loginLink) {
            loginLink.parentElement.remove();
        }

        // Cria o novo menu do usuário
        const userMenuHTML = `
            <li class="user-menu">
                <a href="#" class="user-welcome">Olá, ${user.nome.split(' ')[0]} <i class="fas fa-cog"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="/web/perfil.html">Meu Perfil</a></li>
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
                localStorage.removeItem('userData');
                alert("Você saiu da sua conta.");
                window.location.href = "/web/cadastro.html";
            });
        }
    };

    // Função principal que roda em todas as páginas
    const verificarLogin = async () => {
        // 1. Tenta pegar os dados do cache (localStorage)
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            criarMenuUsuario(JSON.parse(userDataString));
            return; // Se encontrou no cache, o trabalho está feito.
        }

        // 2. Se não achou no cache, busca na API (isso só acontece uma vez por sessão)
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
                localStorage.setItem('userData', JSON.stringify(userData)); // Salva os dados no cache
                criarMenuUsuario(userData); // Cria o menu
            } else {
                throw new Error('Usuário não encontrado na base de dados.');
            }
        } catch (error) {
            // Se qualquer coisa der errado, limpa a sessão para evitar erros futuros
            console.error("Erro de autenticação:", error.message);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            // Opcional: recarregar a página para mostrar o estado "deslogado"
            // window.location.reload(); 
        }
    };

    // Executa a verificação em todas as páginas
    verificarLogin();
});


