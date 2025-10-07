document.addEventListener('DOMContentLoaded', () => {
    // 1. Proteção da Página: Verifica se o usuário está logado.
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/web/cadastro.html";
        return; // Interrompe a execução do script se não houver token.
    }

    // 2. Preenchimento dos Dados (SEM CHAMADA À API)
    // Ele lê os dados do usuário que foram salvos no localStorage durante o login.
    const userDataString = localStorage.getItem('userData');
    
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        
        // Preenche os campos do formulário com os dados salvos.
        // A senha é ignorada por segurança.
        document.getElementById('nome').value = userData.nome || 'Não informado';
        document.getElementById('email').value = userData.email || 'Não informado';
        document.getElementById('telefone').value = userData.telefone || 'Não informado';
        document.getElementById('endereco').value = userData.endereco || 'Não informado';
    } else {
        // Este caso é uma segurança extra se o token existir, mas os dados do usuário não.
        alert("Seus dados de sessão não foram encontrados. Por favor, faça o login novamente.");
        localStorage.removeItem('authToken'); // Limpa o token órfão.
        window.location.href = "/web/cadastro.html";
    }
});
