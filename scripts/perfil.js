document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const form = document.getElementById('perfil-form');
    const inputs = form.querySelectorAll('input:not([type="email"])');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    let originalUserData = {};

    const themeRadios = document.querySelectorAll('input[name="theme"]');

    const tabs = document.querySelectorAll('.perfil-nav-item');
    const tabContents = document.querySelectorAll('.perfil-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/web/cadastro.html";
        return;
    }

    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        originalUserData = { ...userData };
        preencherFormulario(userData);
    } else {
        alert("Seus dados de sessão não foram encontrados. Por favor, faça o login novamente.");
        window.location.href = "/web/cadastro.html";
    }

    function preencherFormulario(data) {
        document.getElementById('nome').value = data.nome || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('endereco').value = data.endereco || '';
    }

    function alternarModoEdicao(isEditing) {
        inputs.forEach(input => input.readOnly = !isEditing);
        editButton.style.display = isEditing ? 'none' : 'block';
        saveButton.style.display = isEditing ? 'block' : 'none';
        cancelButton.style.display = isEditing ? 'block' : 'none';
    }
    editButton.addEventListener('click', () => alternarModoEdicao(true));
    cancelButton.addEventListener('click', () => {
        preencherFormulario(originalUserData);
        alternarModoEdicao(false);
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = JSON.parse(atob(token.split('.')[1]));
        const clienteId = payload.cliente_id || payload.id || payload.userId;
        if (!clienteId) {
            alert("Erro: ID do cliente não encontrado no token.");
            return;
        }
        const dadosAtualizados = {
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            endereco: document.getElementById('endereco').value,
        };
        try {
            const response = await fetch(`https://api-padaria-seven.vercel.app/clientes/${clienteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosAtualizados )
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao atualizar os dados.');
            }
            const userDataAtualizado = await response.json();
            localStorage.setItem('userData', JSON.stringify(userDataAtualizado));
            originalUserData = { ...userDataAtualizado };
            alert("Dados atualizados com sucesso!");
            alternarModoEdicao(false);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert(error.message);
        }
    });

});

// Função para excluir e anterar dados da conta

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const senhaForm = document.getElementById('senha-form');
    const btnExcluir = document.querySelector('.btn-excluir');

    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/web/cadastro.html";
        return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const clienteId = payload.cliente_id || payload.id || payload.userId;

    if (!clienteId) {
        alert("Erro: ID do cliente não encontrado no token.");
        return;
    }

    senhaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const senhaAtual = document.getElementById('senha-atual').value.trim();
        const novaSenha = document.getElementById('nova-senha').value.trim();
        const confirmaSenha = document.getElementById('confirma-senha').value.trim();

        if (!senhaAtual || !novaSenha || !confirmaSenha) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        if (novaSenha !== confirmaSenha) {
            alert("A nova senha e a confirmação não coincidem.");
            return;
        }

        try {
            const response = await fetch(`https://api-padaria-seven.vercel.app/clientes/${clienteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer `
                },
                body: JSON.stringify({
                    senhaAtual,
                    novaSenha
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao alterar a senha.');
            }

            alert("Senha alterada com sucesso!");
            senhaForm.reset();

        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            alert(error.message);
        }
    });

    btnExcluir.addEventListener('click', async () => {
        const confirmacao = confirm("Tem certeza que deseja excluir sua conta? Esta ação é permanente!");
        if (!confirmacao) return;

        try {
            const response = await fetch(`https://api-padaria-seven.vercel.app/clientes/${clienteId}`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao excluir conta.');
            }

            alert("Conta excluída com sucesso. Sentiremos sua falta!");
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = "/web/cadastro.html";

        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            alert(error.message);
        }
    });
});