document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS E ELEMENTOS ---
    const token = localStorage.getItem('authToken');
    const form = document.getElementById('perfil-form');
    const inputs = form.querySelectorAll('input:not([type="email"])');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    let originalUserData = {};

    // Elementos do Tema
    const themeRadios = document.querySelectorAll('input[name="theme"]');

    // --- LÓGICA DAS ABAS ---
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

    // --- PROTEÇÃO E CARREGAMENTO DE DADOS ---
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

    // --- LÓGICA DE EDIÇÃO E SALVAMENTO ---
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
                method: 'PUT',
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

    // --- LÓGICA DE TEMA ---
    const aplicarTema = (tema) => {
        document.body.classList.remove('light-theme');
        if (tema === 'light') {
            document.body.classList.add('light-theme');
        }
    };

    const salvarPreferenciaTema = (tema) => {
        localStorage.setItem('themePreference', tema);
    };

    const temaSalvo = localStorage.getItem('themePreference') || 'dark';
    document.querySelector(`input[name="theme"][value="${temaSalvo}"]`).checked = true;
    
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const novoTema = e.target.value;
            aplicarTema(novoTema);
            salvarPreferenciaTema(novoTema);
        });
    });
});
