// admin.js - Painel Administrativo Padaria Paladar Nobre
// Todas as funcionalidades via API

const BASE_URL = 'https://api-padaria-seven.vercel.app';

document.addEventListener('DOMContentLoaded', () => {
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
        // A tabela tem 5 colunas (ID, Nome, Email, Nível, Ações)
        usuariosTable.innerHTML = '<tr><td colspan="5">Carregando usuários...</td></tr>';
        try {
            // Incluir token se presente (alguns backends exigem Authorization)
            const token = localStorage.getItem('authToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const resp = await fetch(`${BASE_URL}/clientes`, { headers });
            if (!resp.ok) {
                // Tentar extrair mensagem do corpo para diagnóstico
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
                // Tratar campos alternativos
                let id = usuario.id || usuario.cliente_id || usuario.usuario_id || '-';
                let nome = usuario.nome || usuario.name || usuario.usuario || '-';
                let email = usuario.email || usuario.login || usuario.usuario_email || '-';
                let tipo = usuario.tipo || usuario.role || usuario.nivel || '-';
                let criado = usuario.createdAt || usuario.data_criacao || usuario.criado_em || '-';
                let status = usuario.status || usuario.ativo || usuario.situacao || '-';
                const row = document.createElement('tr');
                // Renderizar somente as 5 colunas previstas no cabeçalho
                // Exibir apenas o botão de exclusão conforme solicitação
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
            // Mostrar mensagem de erro detalhada na UI (resumida)
            const msg = String(err.message || err).slice(0, 500); // limitar tamanho exibido
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
                const resp = await fetch(`${BASE_URL}/clientes/${id}`, { method: 'DELETE' });
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
                    const resp = await fetch(`${BASE_URL}/clientes/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
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
                // Extrair clienteId explicitamente (pode ser string/number ou objeto). Tentamos várias estratégias para não receber null.
                let clienteIdForRow = null;
                if (pedido.clienteId) clienteIdForRow = pedido.clienteId;
                else if (pedido.cliente_id) clienteIdForRow = pedido.cliente_id;
                else if (pedido.cliente && (pedido.cliente.id || pedido.cliente._id || pedido.cliente.cliente_id)) {
                    clienteIdForRow = pedido.cliente.id || pedido.cliente._id || pedido.cliente.cliente_id;
                } else if (typeof pedido.cliente === 'string' || typeof pedido.cliente === 'number') {
                    clienteIdForRow = pedido.cliente;
                }
                // Se ainda não encontramos, varrer outras chaves que possam conter o id do cliente
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
                        // também aceitar chaves que terminem em _id e contenham 'cliente'
                        if (/_id$/i.test(k) && /cliente/i.test(k) && !clienteIdForRow) {
                            const val = pedido[k];
                            if (val && (typeof val === 'string' || typeof val === 'number')) { clienteIdForRow = val; break; }
                        }
                    }
                }
                // Exibir nome preferencialmente do cache, senão do objeto, senão id, senão '-'.
                const displayCliente = (clienteIdForRow && clienteNameCache[String(clienteIdForRow)]) || clienteNome || (clienteIdForRow ? String(clienteIdForRow) : '-');
                // Preço: usar subtotal do banco
                let subtotal = pedido.sub_total || pedido.subtotal || pedido.total || pedido.valor || pedido.valor_total;
                if (!subtotal && Array.isArray(pedido.itens)) {
                    subtotal = pedido.itens.reduce((sum, item) => sum + ((item.preco_unitario || item.preco || 0) * (item.quantidade || 1)), 0);
                }
                let preco = subtotal; // Mostrar subtotal na tabela
                let dataPedido = pedido.data || pedido.createdAt || pedido.data_pedido || pedido.dataPedido || '-';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pedido.pedido_id || pedido.id || '-'}</td>
                    <td>${displayCliente}</td>
                    <td>${dataPedido}</td>
                    <td>R$ ${preco ? Number(preco).toFixed(2).replace('.', ',') : '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="ver" title="Ver"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-primary btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="processar" title="Processar"><i class="fas fa-check"></i></button>
                            <button class="btn btn-delete btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="delete" title="Remover"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                // Salva pedido no atributo do elemento para abrir no modal e armazena o id do cliente separadamente
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
            // Abrir modal com os detalhes do pedido (sem status)
            const tr = btn.closest('tr');
            if (!tr) return;
            let pedido = {};
            try { pedido = JSON.parse(tr.dataset.pedido || '{}'); } catch (e) { pedido = {}; }
            // Se preferir, pode buscar o pedido atualizado na API aqui — por enquanto usamos os dados carregados.
            const modal = document.getElementById('modal-pedido');
            const modalInfo = document.getElementById('modal-pedido-info');
            if (!modal || !modalInfo) {
                alert('Detalhes do pedido:\n' + JSON.stringify(pedido, null, 2));
                return;
            }
            // Preço — usar subtotal se existir
            let modalSubtotal = pedido.sub_total || pedido.subtotal || pedido.total || pedido.valor || pedido.valor_total;
            if (!modalSubtotal && Array.isArray(pedido.itens)) {
                modalSubtotal = pedido.itens.reduce((sum, item) => sum + ((item.preco_unitario || item.preco || 0) * (item.quantidade || 1)), 0);
            }
            let modalTaxaEntrega = 0;
            let modalPreco = modalSubtotal || 0;
            // Adicionar taxa de entrega se houver endereço de entrega
            if (pedido.endereco_entrega) {
                modalTaxaEntrega = 5.00;
                modalPreco += modalTaxaEntrega;
            }
            // Buscar nome do cliente pelo id se necessário — priorizamos o id gravado na linha (data-cliente-id)
            let clienteNomeModal = pedido.cliente_nome || (pedido.cliente && pedido.cliente.nome) || pedido.nome_cliente || pedido.nome || null;
            let clienteIdParaBusca = tr?.dataset?.clienteId || null;
            if (!clienteIdParaBusca) {
                // ainda tentar recuperar do objeto pedido
                clienteIdParaBusca = pedido.clienteId || pedido.cliente_id || (pedido.cliente && (pedido.cliente.id || pedido.cliente._id)) || null;
            }
            if (!clienteNomeModal && clienteIdParaBusca) {
                // se for objeto, extrai id
                if (typeof clienteIdParaBusca === 'object') {
                    clienteIdParaBusca = clienteIdParaBusca.id || clienteIdParaBusca._id || null;
                }
                // Primeiro verificar cache
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
            // Garantia de valor a exibir
            clienteNomeModal = clienteNomeModal || (clienteIdParaBusca ? String(clienteIdParaBusca) : '-') ;
            modalInfo.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:0.5rem;font-size:1.05rem;color:var(--text-primary);">
                    <div><strong>ID:</strong> ${pedido.pedido_id || pedido.id || '-'}</div>
                    <div><strong>Cliente:</strong> ${clienteNomeModal}</div>
                    <div><strong>Data:</strong> ${pedido.data || pedido.createdAt || pedido.data_pedido || pedido.dataPedido || '-'}</div>
                    <div><strong>Subtotal:</strong> R$ ${modalSubtotal ? Number(modalSubtotal).toFixed(2).replace('.', ',') : '-'}</div>
                    <div><strong>Total (com entrega):</strong> R$ ${modalPreco ? Number(modalPreco + 5.00).toFixed(2).replace('.', ',') : '-'}</div>
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

    // Fechar modal de pedido (botão e clique fora)
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
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Carregando cardápio...</td></tr>';
        try {
            const response = await fetch(`${BASE_URL}/produtos`);
            if (!response.ok) throw new Error('Falha ao carregar produtos');
            let cardapio = await response.json();
            if (!Array.isArray(cardapio)) cardapio = Object.values(cardapio);
            // Filtros: nome, categoria, estoque
            if (filtros.nome) {
                cardapio = cardapio.filter(item => item.nome && item.nome.toLowerCase().includes(filtros.nome.toLowerCase()));
            }
            if (filtros.categoria && filtros.categoria !== 'all') {
                cardapio = cardapio.filter(item => item.categoria === filtros.categoria);
            }
            if (filtros.estoque === 'in-stock') {
                cardapio = cardapio.filter(item => item.qtd_estoque > 0);
            } else if (filtros.estoque === 'out-of-stock') {
                cardapio = cardapio.filter(item => item.qtd_estoque <= 0);
            }
            tableBody.innerHTML = '';
            if (!cardapio.length) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum item encontrado.</td></tr>';
                return;
            }
            cardapio.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><img src="${item.imagem || ''}" alt="${item.nome || ''}" style="max-width:60px;max-height:60px;border-radius:8px;"></td>
                    <td>${item.nome || '-'}</td>
                    <td>R$ ${item.preco ? Number(item.preco).toFixed(2).replace('.', ',') : '-'}</td>
                    <td>${item.categoria || '-'}</td>
                    <td class="text-center">${item.qtd_estoque ?? '-'}</td>
                    <td class="text-center">
                        <button class="btn btn-edit btn-action" data-id="${item.id || item.produto_id}" data-action="edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete btn-action" data-id="${item.id || item.produto_id}" data-action="delete"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                row.dataset.item = JSON.stringify(item);
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Erro ao carregar cardápio.</td></tr>';
        }
    }

    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
        const nome = document.getElementById('search-input')?.value || '';
        const categoria = document.getElementById('category-filter')?.value || 'all';
        const estoque = document.getElementById('stock-filter')?.value || 'all';
        loadCardapio({ nome, categoria, estoque });
    });

    // Adicionar/Editar item
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
            // Validação rápida dos campos obrigatórios
                if (!body.nome || body.preco === '' || body.qtd_estoque === '' || !body.imagem || !body.descricao) {
                    alert('Preencha todos os campos obrigatórios!');
                    return;
                }
            // POST para adicionar novo produto
            if (!id) {
                resp = await fetch(`${BASE_URL}/produtos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            } else {
                // PATCH para editar produto
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
            loadCardapio();
        } catch (err) {
            alert('Erro ao salvar item: ' + (err.message || err));
        }
    });

    // Editar/Excluir item
    tableBody?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const tr = btn.closest('tr');
        const item = tr ? JSON.parse(tr.dataset.item || '{}') : {};
        if (action === 'edit') {
            // Preencher formulário com dados do item
            itemForm['id'].value = item.id || item.produto_id || '';
            itemForm['nome'].value = item.nome || '';
            itemForm['preco'].value = item.preco || '';
            itemForm['qtd_estoque'].value = item.qtd_estoque || '';
            itemForm['categoria'].value = item.categoria || 'Geral';
            itemForm['imagem'].value = item.imagem || '';
            itemForm['descricao'].value = item.descricao || '';
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
