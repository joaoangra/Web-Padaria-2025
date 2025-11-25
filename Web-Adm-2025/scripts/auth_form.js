// ==========================================================================
// Lógica de Submissão de Formulários de Login e Cadastro
// Depende de: auth.js (para as funções realizarLogin e realizarCadastro)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se a função realizarLogin existe (deve ser exportada em auth.js)
    // As funções precisam estar no escopo global para serem acessadas aqui.
    // Em um projeto real, seria melhor usar módulos, mas para manter a compatibilidade
    // com a estrutura existente, vamos assumir que auth.js as expõe globalmente.
    
    // --- Formulário de Login ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;
            
            // Chama a função global de login (assumindo que auth.js a expõe)
            if (typeof realizarLogin === 'function') {
                realizarLogin(email, senha);
            } else {
                console.error("Função realizarLogin não encontrada.");
            }
        });
    }

    // --- Formulário de Cadastro ---
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('cadastro-nome').value;
            const email = document.getElementById('cadastro-email').value;
            const senha = document.getElementById('cadastro-senha').value;
            const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem.');
                return;
            }
            
            // Chama a função global de cadastro (assumindo que auth.js a expõe)
            if (typeof realizarCadastro === 'function') {
                realizarCadastro(nome, email, senha);
            } else {
                console.error("Função realizarCadastro não encontrada.");
            }
        });
    }
});