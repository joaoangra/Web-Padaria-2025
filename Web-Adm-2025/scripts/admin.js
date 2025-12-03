// admin.js - Painel Administrativo Padaria Paladar Nobre
// Todas as funcionalidades via API

const BASE_URL = 'https://api-padaria-seven.vercel.app';

document.addEventListener('DOMContentLoaded', ( ) => {
    // cache simples de nomes de clientes por id para evitar fetchs repetidos
    const clienteNameCache = {};
    // ===================== SEGURANÇA =====================
    async function checkAdmin() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Acesso negado. Você precisa estar logado como administrador.');
            window.location.href = '/web/cadastro.html';
            return false;
        }
        // Aqui pode adicionar verificação extra se quiser
        return true;
    }

    // ===================== USUÁRIOS =====================
    async function loadUsuarios() {
        const usuariosTable = document.getElementById('usuarios-table-body');
        if (!usuariosTable) return;
        
        usuariosTable.innerHTML = '<tr><td colspan="5">Carregando usuários...</td></tr>';
        
        try {
            // CORREÇÃO: Garante que o token de autenticação seja enviado no cabeçalho.
            // A API de usuários deve exigir autenticação para listar os clientes.
            const token = localStorage.getItem('authToken');
            if (!token) {
                // Se não houver token, não prossegue com a chamada à API.
                throw new Error('Token de autenticação não encontrado. Faça o login novamente.');
            }

            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const resp = await fetch(`${BASE_URL}/clientes`, { headers });

            if (!resp.ok) {
                // Se a resposta for 401 (Não Autorizado) ou 403 (Proibido), o token pode ser inválido.
                if (resp.status === 401 || resp.status === 403) {
                     throw new Error(`Acesso negado pela API. Verifique se o token é válido e se o usuário é administrador. (HTTP ${resp.status})`);
                }
                let bodyText = '';
                try { bodyText = await resp.text(); } catch (e) { bodyText = ''; }
                throw new Error(`Falha ao carregar usuários. URL: ${BASE_URL}/clientes | HTTP ${resp.status} ${resp.statusText} | ${bodyText}`);
            }
            
            let usuarios = await resp.json();
            if (!Array.isArray(usuarios)) usuarios = Object.values(usuarios);
            
            usuariosTable.innerHTML = '';
            if (!usuarios.length) {
                usuariosTable.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
                return;
            }
            
            usuarios.forEach(usuario => {
                let id = usuario.id || usuario.cliente_id || usuario.usuario_id || '-';
                let nome = usuario.nome || usuario.name || usuario.usuario || '-';
                let email = usuario.email || usuario.login || usuario.usuario_email || '-';
                let tipo = usuario.tipo || usuario.role || usuario.nivel || 'cliente'; // Default para 'cliente'
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${id}</td>
                    <td>${nome}</td>
                    <td>${email}</td>
                    <td><span class="status-badge">${tipo}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-delete btn-action" data-id="${id}" data-action="delete" title="Remover"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                usuariosTable.appendChild(row);
            });
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
            const msg = String(err.message || err).slice(0, 500);
            usuariosTable.innerHTML = `
                <tr>
                    <td colspan="5">Erro ao carregar usuários: <strong>${msg}</strong>
                        <div style="margin-top:.5rem;"><button id="retry-load-usuarios" class="btn">Tentar novamente</button>
                        <button id="show-full-error" class="btn">Mostrar no Console</button></div>
                    </td>
                </tr>
            `;
            document.getElementById('retry-load-usuarios')?.addEventListener('click', () => loadUsuarios());
            document.getElementById('show-full-error')?.addEventListener('click', () => console.log(err));
        }
    }

    document.getElementById('usuarios-table-body')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'delete') {
            if (!confirm('Deseja remover este usuário?')) return;
            try {
                const token = localStorage.getItem('authToken');
                const resp = await fetch(`${BASE_URL}/clientes/${id}`, { 
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!resp.ok) throw new Error('Falha ao remover usuário');
                alert('Usuário removido com sucesso.');
                loadUsuarios();
            } catch (err) {
                alert('Erro ao remover usuário.');
            }
        } else if (action === 'edit') {
            const novoNome = prompt('Novo nome para o usuário:');
            if (novoNome) {
                try {
                    const token = localStorage.getItem('authToken');
                    const resp = await fetch(`${BASE_URL}/clientes/${id}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ nome: novoNome })
                    });
                    if (!resp.ok) throw new Error('Falha ao editar usuário');
                    alert('Usuário editado com sucesso!');
                    loadUsuarios();
                } catch (err) {
                    alert('Erro ao editar usuário.');
                }
            }
        }
    });

    // ===================== PEDIDOS =====================
    async function loadPedidos() {
        const pedidosTable = document.getElementById('pedidos-table-body');
        if (!pedidosTable) return;
        pedidosTable.innerHTML = '<tr><td colspan="5">Carregando pedidos...</td></tr>';
        try {
            const resp = await fetch(`${BASE_URL}/pedidos`);
            if (!resp.ok) throw new Error('Falha ao carregar pedidos');
            let pedidos = await resp.json();
            if (!Array.isArray(pedidos)) pedidos = Object.values(pedidos);
            // Coletar todos os cliente_id presentes nos pedidos e buscar nomes em paralelo
            const clienteIds = new Set();
            pedidos.forEach(p => {
                const cid = p.cliente_id || p.clienteId || (p.cliente && (p.cliente.id || p.cliente._id || p.cliente.cliente_id)) || (typeof p.cliente === 'string' || typeof p.cliente === 'number' ? p.cliente : null);
                if (cid) clienteIds.add(String(cid));
            });
            const fetchClientes = Array.from(clienteIds).filter(id => !clienteNameCache[id]).map(async id => {
                try {
                    const r = await fetch(`${BASE_URL}/clientes/${id}`);
                    if (r.ok) {
                        const c = await r.json();
                        clienteNameCache[id] = c.nome || c.name || c.usuario || c.email || String(id);
                    } else {
                        clienteNameCache[id] = String(id);
                    }
                } catch (e) {
                    clienteNameCache[id] = String(id);
                }
            });
            if (fetchClientes.length) await Promise.all(fetchClientes);
            pedidosTable.innerHTML = '';
            if (!pedidos.length) {
                pedidosTable.innerHTML = '<tr><td colspan="5">Nenhum pedido encontrado.</td></tr>';
                return;
            }
            pedidos.forEach(pedido => {
                let clienteNome = pedido.cliente_nome || (pedido.cliente && pedido.cliente.nome) || pedido.nome_cliente || pedido.nome || null;
                let clienteIdForRow = null;
                if (pedido.clienteId) clienteIdForRow = pedido.clienteId;
                else if (pedido.cliente_id) clienteIdForRow = pedido.cliente_id;
                else if (pedido.cliente && (pedido.cliente.id || pedido.cliente._id || pedido.cliente.cliente_id)) {
                    clienteIdForRow = pedido.cliente.id || pedido.cliente._id || pedido.cliente.cliente_id;
                } else if (typeof pedido.cliente === 'string' || typeof pedido.cliente === 'number') {
                    clienteIdForRow = pedido.cliente;
                }
                if (!clienteIdForRow) {
                    for (const k of Object.keys(pedido)) {
                        if (/cliente(_?id)?$/i.test(k) || /^clienteid$/i.test(k)) {
                            const val = pedido[k];
                            if (val && (typeof val === 'string' || typeof val === 'number')) {
                                clienteIdForRow = val; break;
                            }
                            if (val && typeof val === 'object') {
                                clienteIdForRow = val.id || val._id || val.cliente_id || null;
                                if (clienteIdForRow) break;
                            }
                        }
                        if (/_id$/i.test(k) && /cliente/i.test(k) && !clienteIdForRow) {
                            const val = pedido[k];
                            if (val && (typeof val === 'string' || typeof val === 'number')) { clienteIdForRow = val; break; }
                        }
                    }
                }
                const displayCliente = (clienteIdForRow && clienteNameCache[String(clienteIdForRow)]) || clienteNome || (clienteIdForRow ? String(clienteIdForRow) : '-');
                
                // Preço: usar subtotal do banco
                let preco = pedido.sub_total || pedido.subtotal || pedido.total || pedido.valor || pedido.valor_total;
                if (!preco && Array.isArray(pedido.itens)) {
                    preco = pedido.itens.reduce((sum, item) => sum + ((item.preco_unitario || item.preco || 0) * (item.quantidade || 1)), 0);
                }

                // CORREÇÃO: Adiciona a taxa de entrega de R$ 5,00 ao valor final do pedido.
                const taxaEntrega = 5.00;
                const valorFinal = (preco ? Number(preco) : 0) + taxaEntrega;

                let dataPedido = pedido.data || pedido.createdAt || pedido.data_pedido || pedido.dataPedido || '-';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pedido.pedido_id || pedido.id || '-'}</td>
                    <td>${displayCliente}</td>
                    <td>${dataPedido}</td>
                    <td>R$ ${valorFinal.toFixed(2).replace('.', ',')}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="ver" title="Ver"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-delete btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="delete" title="Remover"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                try { row.dataset.pedido = JSON.stringify(pedido); } catch (e) { row.dataset.pedido = '{}'; }
                row.dataset.clienteId = clienteIdForRow ? String(clienteIdForRow) : '';
                pedidosTable.appendChild(row);
            });
        } catch (err) {
            pedidosTable.innerHTML = '<tr><td colspan="5">Erro ao carregar pedidos.</td></tr>';
        }
    }

    document.getElementById('pedidos-table-body')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'delete') {
            if (!confirm('Deseja remover este pedido?')) return;
            try {
                const resp = await fetch(`${BASE_URL}/pedidos/${id}`, { method: 'DELETE' });
                if (!resp.ok) throw new Error('Falha ao remover pedido');
                alert('Pedido removido com sucesso.');
                loadPedidos();
            } catch (err) {
                alert('Erro ao remover pedido.');
            }
        } else if (action === 'ver') {
            const tr = btn.closest('tr');
            if (!tr) return;
            let pedido = {};
            try { pedido = JSON.parse(tr.dataset.pedido || '{}'); } catch (e) { pedido = {}; }
            
            const modal = document.getElementById('modal-pedido');
            const modalInfo = document.getElementById('modal-pedido-info');
            if (!modal || !modalInfo) {
                alert('Detalhes do pedido:\n' + JSON.stringify(pedido, null, 2));
                return;
            }
            
            let modalPreco = pedido.sub_total || pedido.subtotal || pedido.total || pedido.valor || pedido.valor_total;
            if (!modalPreco && Array.isArray(pedido.itens)) {
                modalPreco = pedido.itens.reduce((sum, item) => sum + ((item.preco_unitario || item.preco || 0) * (item.quantidade || 1)), 0);
            }

            // CORREÇÃO: Adiciona a taxa de entrega também no modal de visualização.
            const taxaEntrega = 5.00;
            const valorFinalModal = (modalPreco ? Number(modalPreco) : 0) + taxaEntrega;

            let clienteNomeModal = pedido.cliente_nome || (pedido.cliente && pedido.cliente.nome) || pedido.nome_cliente || pedido.nome || null;
            let clienteIdParaBusca = tr?.dataset?.clienteId || null;
            if (!clienteIdParaBusca) {
                clienteIdParaBusca = pedido.clienteId || pedido.cliente_id || (pedido.cliente && (pedido.cliente.id || pedido.cliente._id)) || null;
            }
            if (!clienteNomeModal && clienteIdParaBusca) {
                if (typeof clienteIdParaBusca === 'object') {
                    clienteIdParaBusca = clienteIdParaBusca.id || clienteIdParaBusca._id || null;
                }
                if (clienteIdParaBusca && clienteNameCache[String(clienteIdParaBusca)]) {
                    clienteNomeModal = clienteNameCache[String(clienteIdParaBusca)];
                }
                if (clienteIdParaBusca && (typeof clienteIdParaBusca === 'string' || typeof clienteIdParaBusca === 'number')) {
                    try {
                        const respCliente = await fetch(`${BASE_URL}/clientes/${clienteIdParaBusca}`);
                        if (respCliente.ok) {
                            const clienteObj = await respCliente.json();
                            clienteNomeModal = clienteObj.nome || clienteObj.name || clienteObj.usuario || clienteObj.email || String(clienteIdParaBusca);
                        } else {
                            clienteNomeModal = String(clienteIdParaBusca);
                        }
                    } catch (e) {
                        clienteNomeModal = String(clienteIdParaBusca);
                    }
                }
            }
            clienteNomeModal = clienteNomeModal || (clienteIdParaBusca ? String(clienteIdParaBusca) : '-') ;
            
            modalInfo.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:0.5rem;font-size:1.05rem;color:var(--text-primary);">
                    <div><strong>ID:</strong> ${pedido.pedido_id || pedido.id || '-'}</div>
                    <div><strong>Cliente:</strong> ${clienteNomeModal}</div>
                    <div><strong>Data:</strong> ${pedido.data || pedido.createdAt || pedido.data_pedido || pedido.dataPedido || '-'}</div>
                    <div><strong>Subtotal:</strong> R$ ${modalPreco ? Number(modalPreco).toFixed(2).replace('.', ',') : '-'}</div>
                    <div><strong>Taxa de Entrega:</strong> R$ ${taxaEntrega.toFixed(2).replace('.', ',')}</div>
                    <hr>
                    <div><strong>Valor Final:</strong> R$ ${valorFinalModal.toFixed(2).replace('.', ',')}</div>
                </div>
            `;
            modal.style.display = 'flex';
        } else if (action === 'processar') {
            try {
                const resp = await fetch(`${BASE_URL}/pedidos/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Processado' })
                });
                if (!resp.ok) throw new Error('Falha ao processar pedido');
                alert('Pedido processado com sucesso!');
                loadPedidos();
            } catch (err) {
                alert('Erro ao processar pedido.');
            }
        }
    });

    const modalCloseBtn = document.getElementById('close-modal-pedido');
    const modalPedidoEl = document.getElementById('modal-pedido');
    if (modalCloseBtn && modalPedidoEl) {
        modalCloseBtn.addEventListener('click', () => { modalPedidoEl.style.display = 'none'; });
        modalPedidoEl.addEventListener('click', (ev) => { if (ev.target === modalPedidoEl) modalPedidoEl.style.display = 'none'; });
    }

    // ===================== ESTOQUE =====================
    async function loadEstoque() {
        const estoqueTable = document.getElementById('estoque-table-body');
        if (!estoqueTable) return;
        estoqueTable.innerHTML = '<tr><td colspan="5">Carregando estoque...</td></tr>';
        try {
            const resp = await fetch(`${BASE_URL}/estoque`);
            if (!resp.ok) throw new Error('Falha ao carregar estoque');
            let estoque = await resp.json();
            if (!Array.isArray(estoque)) estoque = Object.values(estoque);
            estoqueTable.innerHTML = '';
            if (!estoque.length) {
                estoqueTable.innerHTML = '<tr><td colspan="5">Nenhum movimento encontrado.</td></tr>';
                return;
            }
            estoque.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.estoque_id || item.id || '-'}</td>
                    <td>${item.produto_id || '-'}</td>
                    <td>${item.movimento || '-'}</td>
                    <td>${item.quantidade || '-'}</td>
                    <td>${item.data || '-'}</td>
                `;
                estoqueTable.appendChild(row);
            });
        } catch (err) {
            estoqueTable.innerHTML = '<tr><td colspan="5">Erro ao carregar estoque.</td></tr>';
        }
    }

// ===================== CARDÁPIO CRUD =====================
const tableBody = document.getElementById('cardapio-table-body');
async function loadCardapio(filtros = {}) {
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando cardápio...</td></tr>'; // Alterado colspan para 5 colunas
    try {
        const response = await fetch(`${BASE_URL}/produtos`);
        if (!response.ok) throw new Error('Falha ao carregar produtos');
        let cardapio = await response.json();
        if (!Array.isArray(cardapio)) cardapio = Object.values(cardapio);

        // Filtros (mantidos como no seu original, mas a categoria foi removida da tabela)
        if (filtros.nome) {
            cardapio = cardapio.filter(item => item.nome && item.nome.toLowerCase().includes(filtros.nome.toLowerCase()));
        }
        // ... outros filtros que você queira manter ...

        tableBody.innerHTML = '';
        if (!cardapio.length) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum item encontrado.</td></tr>';
            return;
        }
        cardapio.forEach(item => {
            const row = document.createElement('tr');

            // ***** INÍCIO DA CORREÇÃO *****
            // 1. Garante que o estoque seja um número, usando '??' para testar múltiplos nomes de campo e definir 0 como padrão.
            const estoqueVisivel = item.qtd_estoque ?? item.estoque ?? 0;
            
            // 2. A coluna de categoria foi removida do HTML da linha.
            // 3. A variável 'estoqueVisivel' é usada para exibir o valor correto.
            row.innerHTML = `
                <td><img src="${item.imagem || ''}" alt="${item.nome || ''}" style="max-width:60px;max-height:60px;border-radius:8px;"></td>
                <td>${item.nome || '-'}</td>
                <td>R$ ${item.preco ? Number(item.preco).toFixed(2).replace('.', ',') : '-'}</td>
                <td class="text-center">${estoqueVisivel}</td>
                <td class="text-center">
                    <button class="btn btn-edit btn-action" data-id="${item.id || item.produto_id}" data-action="edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-delete btn-action" data-id="${item.id || item.produto_id}" data-action="delete"><i class="fas fa-trash"></i></button>
                </td>
            `;
            

            row.dataset.item = JSON.stringify(item);
            tableBody.appendChild(row);
        });
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar cardápio.</td></tr>';
    }
}

    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
        const nome = document.getElementById('search-input')?.value || '';
        const categoria = document.getElementById('category-filter')?.value || 'all';
        const estoque = document.getElementById('stock-filter')?.value || 'all';
        loadCardapio({ nome, categoria, estoque });
    });

    const itemForm = document.getElementById('item-form');
    itemForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = itemForm['id'].value;
        const body = {
            nome: itemForm['nome'].value,
            preco: Number(itemForm['preco'].value),
            qtd_estoque: Number(itemForm['qtd_estoque'].value),
            imagem: itemForm['imagem'].value,
            descricao: itemForm['descricao'].value
        };
        try {
            let resp;
            if (!body.nome || body.preco === '' || body.qtd_estoque === '' || !body.imagem || !body.descricao) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }
            if (!id) {
                resp = await fetch(`${BASE_URL}/produtos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            } else {
                resp = await fetch(`${BASE_URL}/produtos/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }
            if (!resp.ok) {
                const errMsg = await resp.text();
                alert('Erro ao salvar item: ' + errMsg);
                return;
            }
            itemForm.reset();
            document.getElementById('form-title').textContent = 'Adicionar Novo Item';
            document.getElementById('save-btn-text').textContent = 'Salvar Item';
            document.getElementById('cancel-edit-btn').style.display = 'none';
            loadCardapio();
        } catch (err) {
            alert('Erro ao salvar item: ' + (err.message || err));
        }
    });

    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
        itemForm.reset();
        document.getElementById('form-title').textContent = 'Adicionar Novo Item';
        document.getElementById('save-btn-text').textContent = 'Salvar Item';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    });

    tableBody?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const tr = btn.closest('tr');
        const item = tr ? JSON.parse(tr.dataset.item || '{}') : {};
        if (action === 'edit') {
            itemForm['id'].value = item.id || item.produto_id || '';
            itemForm['nome'].value = item.nome || '';
            itemForm['preco'].value = item.preco || '';
            itemForm['qtd_estoque'].value = item.qtd_estoque || '';
            itemForm['imagem'].value = item.imagem || '';
            itemForm['descricao'].value = item.descricao || '';
            document.getElementById('form-title').textContent = 'Editar Item';
            document.getElementById('save-btn-text').textContent = 'Atualizar Item';
            document.getElementById('cancel-edit-btn').style.display = 'inline-block';
            window.scrollTo({ top: itemForm.offsetTop - 40, behavior: 'smooth' });
        } else if (action === 'delete') {
            if (!confirm('Deseja remover este item do cardápio?')) return;
            try {
                const resp = await fetch(`${BASE_URL}/produtos/${id}`, { method: 'DELETE' });
                if (!resp.ok) throw new Error('Erro ao remover item');
                loadCardapio();
            } catch (err) {
                alert('Erro ao remover item.');
            }
        }
    });

    // ========== Inicialização das páginas ========== 
    if (window.location.pathname.includes('gerenciar_cardapio.html')) {
        checkAdmin().then(isOk => {
            if (isOk) loadCardapio();
        });
    } else if (window.location.pathname.includes('gerenciar_pedidos.html')) {
        checkAdmin().then(isOk => {
            if (isOk) loadPedidos();
        });
    } else if (window.location.pathname.includes('gerenciar_usuarios.html')) {
        checkAdmin().then(isOk => {
            if (isOk) loadUsuarios();
        });
    } else if (window.location.pathname.includes('dashboard.html')) {
        checkAdmin();
    }
});
