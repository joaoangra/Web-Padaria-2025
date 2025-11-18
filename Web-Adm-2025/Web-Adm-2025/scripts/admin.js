const BASE_URL = 'https://api.example.com';

async function loadPedidos() {
    const pedidosTable = document.getElementById('pedidos-table-body');
    if (!pedidosTable) return;
    pedidosTable.innerHTML = '<tr><td colspan="5">Carregando pedidos...</td></tr>';
    try {
        const resp = await fetch(`${BASE_URL}/pedidos`);
        if (!resp.ok) throw new Error('Falha ao carregar pedidos');
        let pedidos = await resp.json();
        if (!Array.isArray(pedidos)) pedidos = Object.values(pedidos);
        pedidosTable.innerHTML = '';
        if (!pedidos.length) {
            pedidosTable.innerHTML = '<tr><td colspan="5">Nenhum pedido encontrado.</td></tr>';
            return;
        }
        pedidos.forEach(pedido => {
            // Nome do cliente
            let clienteNome = pedido.cliente_nome || (pedido.cliente && pedido.cliente.nome) || pedido.nome_cliente || pedido.nome || '-';
            let preco = pedido.subtotal || pedido.total || pedido.valor || pedido.valor_total;
            if (!preco && Array.isArray(pedido.itens)) {
                preco = pedido.itens.reduce((sum, item) => sum + ((item.preco_unitario || item.preco || 0) * (item.quantidade || 1)), 0);
            }
            let dataPedido = pedido.data || pedido.createdAt || pedido.data_pedido || pedido.dataPedido || '-';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pedido.pedido_id || pedido.id || '-'}</td>
                <td>${clienteNome}</td>
                <td>${dataPedido}</td>
                <td>R$ ${preco ? Number(preco).toFixed(2).replace('.', ',') : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="ver"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-primary btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="processar"><i class="fas fa-check"></i></button>
                        <button class="btn btn-delete btn-action" data-id="${pedido.pedido_id || pedido.id}" data-action="delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            // Salva pedido para uso no modal
            row.dataset.pedido = JSON.stringify(pedido);
            pedidosTable.appendChild(row);
        });
        // Listener para abrir modal ao clicar em "ver"
        pedidosTable.querySelectorAll('button[data-action="ver"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const tr = btn.closest('tr');
                const pedido = JSON.parse(tr.dataset.pedido);
                const modal = document.getElementById('modal-pedido');
                const modalInfo = document.getElementById('modal-pedido-info');
                let itensHtml = '';
                if (Array.isArray(pedido.itens)) {
                    itensHtml = `<ul style='margin:0 0 1rem 0;padding-left:1.2rem;'>` + pedido.itens.map(item => `<li>${item.nome || item.produto || '-'} x${item.quantidade || 1} - R$ ${item.preco_unitario ? Number(item.preco_unitario).toFixed(2).replace('.', ',') : '-'}</li>`).join('') + `</ul>`;
                }
                modalInfo.innerHTML = `
                    <strong>ID:</strong> ${pedido.pedido_id || pedido.id || '-'}<br>
                    <strong>Cliente:</strong> ${pedido.cliente_nome || (pedido.cliente && pedido.cliente.nome) || pedido.nome_cliente || pedido.nome || '-'}<br>
                    <strong>Data:</strong> ${pedido.data || pedido.createdAt || pedido.data_pedido || pedido.dataPedido || '-'}<br>
                    <strong>Preço:</strong> R$ ${preco ? Number(preco).toFixed(2).replace('.', ',') : '-'}<br>
                    <strong>Itens:</strong> ${itensHtml}
                `;
                modal.style.display = 'flex';
            });
        });
        // Fechar modal
        document.getElementById('close-modal-pedido').onclick = function() {
            document.getElementById('modal-pedido').style.display = 'none';
        };
    } catch (err) {
        pedidosTable.innerHTML = '<tr><td colspan="5">Erro ao carregar pedidos.</td></tr>';
    }
}