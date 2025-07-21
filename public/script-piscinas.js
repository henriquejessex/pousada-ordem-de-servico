// --- DADOS (Simulação de um Banco de Dados) ---

// 1. Ordens de Serviço que estariam salvas no sistema
/*const ordensDeServicoAbertas = [
    { osId: 1, itemId: "piscina-adulto-aquecedor", descricao: "Aquecedor não funciona", prioridade: "Alta" },
    { osId: 2, itemId: "sauna-umida", descricao: "Vapor não está saindo", prioridade: "Média" },
    { osId: 3, itemId: "duchas-externas", descricao: "Registro vazando", prioridade: "Baixa" }
];*/

// 2. Itens de manutenção da área da piscina
const area = {
    name: "Piscinas",
    items: [
        { id: "piscina-adulto-bomba", name: "Bomba da Piscina Adulto" },
        { id: "piscina-adulto-aquecedor", name: "Aquecedor da Piscina Adulto" },
        { id: "piscina-adulto-iluminacao", name: "Iluminação da Piscina Adulto" },
        { id: "piscina-infantil-bomba", name: "Bomba da Piscina Infantil" },
        { id: "piscina-infantil-cascata", name: "Cascata da Piscina Infantil" },
        { id: "sauna-umida", name: "Sauna Úmida" },
        { id: "sauna-seca", name: "Sauna Seca" },
        { id: "duchas-externas", name: "Duchas Externas" },
    ]
};

// --- FUNÇÃO DE RENDERIZAÇÃO ---
function renderAreaItems() {
    const container = document.getElementById('items-container');
    if (!container) {
        console.error('Elemento "items-container" não encontrado no DOM.');
        return;
    }
    container.innerHTML = ''; // Limpa o conteúdo anterior

    const itemsList = document.createElement('div');
    itemsList.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4';

    area.items.forEach(item => {
        // Verifica se existe uma O.S. aberta para este item
        const osAberta = ordensDeServicoAbertas.find(os => os.itemId === item.id);

        const itemButton = document.createElement('button');
        
        // Define as classes de estilo padrão
        let buttonClasses = 'p-4 rounded-lg text-left font-medium transition-colors duration-200 shadow-sm border';

        // Adiciona classes de cor com base na prioridade da O.S.
        if (osAberta) {
            switch (osAberta.prioridade) {
                case 'Alta':
                    buttonClasses += ' bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
                    break;
                case 'Média':
                    buttonClasses += ' bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
                    break;
                case 'Baixa':
                    buttonClasses += ' bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
                    break;
                default:
                    buttonClasses += ' bg-white text-gray-700 border-gray-200 hover:bg-blue-100';
            }
        } else {
            // Estilo padrão para itens sem O.S. aberta
            buttonClasses += ' bg-white text-gray-700 border-gray-200 hover:bg-blue-100';
        }

        itemButton.className = buttonClasses;
        itemButton.textContent = item.name;
        
        itemButton.onclick = () => {
            console.log(`Item '${item.name}' (ID: ${item.id}) selecionado.`);
            // Futuramente, isso abrirá o modal para ver a O.S. ou criar uma nova
            const osInfo = osAberta ? `\nPrioridade: ${osAberta.prioridade}\nDescrição: ${osAberta.descricao}` : "\nNenhuma O.S. aberta.";
            alert(`Item '${item.name}' selecionado.${osInfo}`);
        };
        itemsList.appendChild(itemButton);
    });

    container.appendChild(itemsList);
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    renderAreaItems();
});
