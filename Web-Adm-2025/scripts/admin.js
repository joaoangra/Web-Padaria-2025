// ==========================================================================
// Lógica do Painel Administrativo (Dashboard e Gerenciamento de Cardápio)
// Depende de: auth.js (para verificação de login)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://api-padaria-seven.vercel.app';
    const adminModal = document.getElementById('adminModal');
    const itemForm = document.getElementById('item-form');
    const addItemBtn = document.getElementById('add-item-btn');
    const modalTitle = document.getElementById('modal-title');
    const tableBody = document.querySelector('.admin-table tbody');
    
    // --- Funções de Segurança e Inicialização ---
    
    // Verifica se o usuário é admin (a lógica principal está em auth.js)
    const checkAdmin = async () => {
        const userDataRaw = localStorage.getItem('userData');
        let userData = userDataRaw ? JSON.parse(userDataRaw) : null;
        const token = localStorage.getItem('authToken');

        // Se não há token, bloqueia imediatamente
        if (!token) {
            alert("Acesso negado. Você precisa estar logado como administrador.");
            window.location.href = "../../web/cadastro.html";
            return false;
        }

        // Função utilitária para normalizar e verificar se um objeto representa um admin
        const isAdminFromObj = (obj) => {
            if (!obj) return false;
            const tipo = obj.tipo || obj.TipoUsuario || obj.tipoUsuario || obj.type || obj.role || obj.cargo || null;
            if (typeof tipo === 'string') {
                const t = tipo.toLowerCase();
                if (t.includes('adm') || t === 'admin' || t === 'administrador') return true;
                if (t.includes('com') || t.includes('cli')) return false;
            }
            // se vier id, usuário pode ter tipoUsuarioId
            if (obj.tipoUsuarioId || obj.TipoUsuarioId || obj.tipo_usuario_id) return 'maybe-id';
            return false;
        };

        // Verifica localStorage primeiro
        const localCheck = isAdminFromObj(userData);
        if (localCheck === true) return true;

        const BASE_URL = 'https://api-padaria-seven.vercel.app';

        // Tenta extrair id do token
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
            const payload = parseJwt(token);
            const clienteId = payload && (payload.cliente_id || payload.clienteId || payload.id || payload.userId || payload.sub);

            // lista de endpoints para tentar recuperar dados do cliente
            const endpoints = [];
            if (clienteId) endpoints.push(`${BASE_URL}/clientes/${clienteId}`);
            endpoints.push(`${BASE_URL}/cliente`);
            endpoints.push(`${BASE_URL}/cliente/me`);
            endpoints.push(`${BASE_URL}/clientes/me`);

            // também tenta buscar por email se tivermos em userData
            if (userData && userData.email) endpoints.push(`${BASE_URL}/clientes?email=${encodeURIComponent(userData.email)}`);

            for (const ep of endpoints) {
                try {
                    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
                    // se for busca por email pública, não enviar Authorization may not be needed but safe
                    const resp = await fetch(ep, { headers });
                    if (!resp.ok) continue;
                    const d = await resp.json();
                    const candidate = d.client || d.cliente || d.user || d || {};
                    // atualiza localStorage
                    if (candidate && Object.keys(candidate).length) {
                        userData = candidate;
                        localStorage.setItem('userData', JSON.stringify(userData));
                    }

                    const adminCheck = isAdminFromObj(candidate);
                    if (adminCheck === true) return true;

                    // se retornou 'maybe-id', tenta resolver o id para nome via /tipousuario/{id}
                    const tipoId = candidate.tipoUsuarioId || candidate.TipoUsuarioId || candidate.tipo_usuario_id || null;
                    if (tipoId) {
                        try {
                            const tipoResp = await fetch(`${BASE_URL}/tipousuario/${tipoId}`, { headers });
                            if (tipoResp.ok) {
                                const tipoData = await tipoResp.json();
                                const tipoObj = tipoData.tipo || tipoData || {};
                                const nomeTipo = tipoObj.nome || tipoObj.tipo || tipoObj.nomeTipo || null;
                                if (nomeTipo && String(nomeTipo).toLowerCase().includes('adm')) return true;
                            }
                        } catch (err) { /* ignore */ }
                    }
                } catch (err) {
                    // tenta próximo endpoint
                    console.warn('checkAdmin: endpoint failed', ep, err.message || err);
                }
            }
        } catch (err) {
            console.warn('checkAdmin: falha ao verificar token/payload', err.message || err);
        }

        // se chegou aqui, não é admin
        alert('Acesso negado. Você precisa ser administrador.');
        window.location.href = '../../web/cadastro.html';
        return false;
    };

    // --- Funções do Modal ---

    const openModal = (isEditing = false) => {
        if (!adminModal) return;
        adminModal.classList.add('show');
        document.body.classList.add('modal-open');
        adminModal.setAttribute('aria-hidden', 'false');
        // Foca no primeiro campo do formulário
        setTimeout(() => document.getElementById('item-nome')?.focus(), 50);
    };

    const closeModal = () => {
        if (!adminModal) return;
        adminModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        adminModal.setAttribute('aria-hidden', 'true');
        itemForm?.reset();
        document.getElementById('item-id').value = '';
        document.getElementById('image-preview').src = '';
        document.getElementById('image-preview').classList.add('hidden');
    };

    // --- Funções de Gerenciamento de Cardápio ---

    const loadCardapio = async () => {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Carregando cardápio...</td></tr>';

        try {
            const response = await fetch(`${BASE_URL}/produtos`);
            if (!response.ok) throw new Error('Falha ao carregar produtos');
            const cardapio = await response.json();
            renderCardapioTable(cardapio);
        } catch (error) {
            console.error('Erro ao carregar cardápio:', error);
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Erro ao carregar cardápio.</td></tr>';
        }
    };

    const renderCardapioTable = (cardapio) => {
        tableBody.innerHTML = '';
        if (cardapio.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum item no cardápio.</td></tr>';
            return;
        }

        cardapio.forEach(item => {
            const row = tableBody.insertRow();
            const precoFormatado = parseFloat(item.preco).toFixed(2).replace('.', ',');
            const estoqueStatus = item.qtd_estoque > 0 ? `<span class="status-badge status-active">Em Estoque</span>` : `<span class="status-badge status-inactive">Esgotado</span>`;

            row.innerHTML = `
                <td>${item.produto_id}</td>
                <td><img src="${item.imagem}" alt="${item.nome}" class="img-thumbnail"></td>
                <td>${item.nome}</td>
                <td>${item.categoria || 'N/A'}</td>
                <td>R$ ${precoFormatado}</td>
                <td>${item.qtd_estoque}</td>
                <td>${estoqueStatus}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-action" data-id="${item.produto_id}" data-action="edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete btn-action" data-id="${item.produto_id}" data-action="delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
        });
    };

    const editItem = async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/produtos/${id}`);
            if (!response.ok) throw new Error('Item não encontrado');
            const item = await response.json();

            modalTitle.textContent = 'Editar Item: ' + item.nome;
            document.getElementById('item-id').value = item.produto_id;
            document.getElementById('item-nome').value = item.nome;
            document.getElementById('item-descricao').value = item.descricao;
            document.getElementById('item-preco').value = item.preco;
            document.getElementById('item-categoria').value = item.categoria;
            document.getElementById('item-estoque').value = item.qtd_estoque;
            document.getElementById('item-imagem').value = item.imagem;
            
            const preview = document.getElementById('image-preview');
            preview.src = item.imagem;
            preview.classList.remove('hidden');

            openModal(true);
        } catch (error) {
            alert('Erro ao carregar dados para edição: ' + error.message);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Tem certeza que deseja remover este item do cardápio?')) return;

        try {
            // Chamada real à API para DELETE
            const response = await fetch(`${BASE_URL}/produtos/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao remover item');
            
            alert('Item removido com sucesso.');
            loadCardapio(); // Recarrega a lista
        } catch (error) {
            alert('Erro ao remover item: ' + error.message);
        }
    };

    // --- Event Listeners ---

    // Inicialização da página (checkAdmin agora é async)
    if (window.location.pathname.includes('gerenciar_cardapio.html')) {
        checkAdmin().then(isOk => {
            if (isOk) loadCardapio();
        });
    } else if (window.location.pathname.includes('dashboard.html')) {
        checkAdmin(); // Apenas verifica o login para o dashboard
    }

    // Botão Adicionar Item
    addItemBtn?.addEventListener('click', () => {
        modalTitle.textContent = 'Adicionar Novo Item';
        closeModal(); // Reseta o formulário
        openModal();
    });

    // Submissão do Formulário
    itemForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('item-id').value;
        const nome = document.getElementById('item-nome').value;
        const descricao = document.getElementById('item-descricao').value;
        const preco = parseFloat(document.getElementById('item-preco').value);
        const categoria = document.getElementById('item-categoria').value;
        const qtd_estoque = parseInt(document.getElementById('item-estoque').value);
        const imagem = document.getElementById('item-imagem').value;
        
        const itemData = { nome, descricao, preco, categoria, qtd_estoque, imagem };
        
        try {
            let method = id ? 'PATCH' : 'POST'; // A API usa PATCH para atualização
            let url = id ? `${BASE_URL}/produtos/${id}` : `${BASE_URL}/produtos`;
            
            // Chamada real à API para POST/PATCH
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            if (!response.ok) throw new Error('Falha ao salvar item');
            
            alert(`Item ${id ? 'editado' : 'adicionado'} com sucesso.`);
            closeModal();
            loadCardapio();
        } catch (error) {
            alert('Erro ao salvar item: ' + error.message);
        }
    });

    // Delegação de eventos para botões de ação na tabela
    tableBody?.addEventListener('click', (e) => {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const id = parseInt(target.dataset.id);
        const action = target.dataset.action;

        if (action === 'edit') {
            editItem(id);
        } else if (action === 'delete') {
            deleteItem(id);
        }
    });

    // Fechar modal pelo botão X
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    
    // Fechar modal pelo overlay
    adminModal?.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            closeModal();
        }
    });
    
    // Preview da imagem no formulário
    document.getElementById('item-imagem')?.addEventListener('input', (e) => {
        const preview = document.getElementById('image-preview');
        if (e.target.value) {
            preview.src = e.target.value;
            preview.classList.remove('hidden');
        } else {
            preview.classList.add('hidden');
        }
    });
});
