// Passo 1: Importar as ferramentas necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =================================================================================
// COLOQUE A SUA CONFIGURAÇÃO DO FIREBASE AQUI
// =================================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDOX6-_E2_KfR_hWocwdXW6yIkM9ztG7zM",
    authDomain: "pousada-os-app.firebaseapp.com",
    projectId: "pousada-os-app",
    storageBucket: "pousada-os-app.firebasestorage.app",
    messagingSenderId: "73452578057",
    appId: "1:73452578057:web:f079b0f35775ded7e1dfd8"
};
// =================================================================================

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Elementos do DOM para o novo Modal ---
const viewOsModal = document.getElementById('view-os-modal');
const closeModalBtn = document.getElementById('close-view-modal-btn');
const modalAptNumber = document.getElementById('modal-apt-number');
const modalOsList = document.getElementById('modal-os-list');

// --- Elementos do DOM para o Modal de Edição ---
const editOsModal = document.getElementById('edit-os-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');

// --- DADOS ESTRUTURAIS DO PRÉDIO ---
const building = {
    name: "Prédio Principal",
    floors: [
        { name: "2º Andar", level: 2, apartments: 13 },
        { name: "1º Andar", level: 1, apartments: 13 },
        { name: "Térreo", level: 0, apartments: 13 },
    ]
};

/**
 * Passo 2: Busca todas as O.S. que NÃO estão "Concluídas" e as processa
 * num formato útil para a renderização.
 * @returns {Promise<object>} Um objeto onde cada chave é um ID de apartamento
 * e o valor contém a contagem e a maior prioridade.
 */
async function fetchAndProcessOS() {
    // Objeto que vamos construir. Ex: { "apt-215": { count: 2, highestPriority: "Alta" } }
    const osDataByApartment = {};

    // Define a ordem de importância das prioridades
    const priorityOrder = { "Alta": 3, "Média": 2, "Baixa": 1 };

    // Cria uma consulta ao Firestore para pegar apenas as O.S. relevantes
    const osCollectionRef = collection(db, 'ordens_de_servico');
    const q = query(osCollectionRef, where("status", "!=", "Concluída"));

    try {
        const querySnapshot = await getDocs(q);

        // Itera sobre cada O.S. encontrada
        querySnapshot.forEach((doc) => {
            const os = doc.data();
            const locationId = os.locationId; // Ex: "apt-215"

            // Se este apartamento ainda não está na nossa lista de resumo, inicializa-o
            if (!osDataByApartment[locationId]) {
                osDataByApartment[locationId] = {
                    count: 0,
                    highestPriority: "Baixa" // Começa com a prioridade mais baixa
                };
            }

            // Incrementa a contagem de O.S. para este apartamento
            osDataByApartment[locationId].count++;

            // Verifica se a prioridade da O.S. atual é maior do que a já guardada
            if (priorityOrder[os.priority] > priorityOrder[osDataByApartment[locationId].highestPriority]) {
                osDataByApartment[locationId].highestPriority = os.priority;
            }
        });

        console.log("Dados de O.S. processados:", osDataByApartment);
        return osDataByApartment;

    } catch (error) {
        console.error("Erro ao buscar as Ordens de Serviço: ", error);
        return {}; // Retorna um objeto vazio em caso de erro
    }
}

/**
 * Busca e exibe as O.S. de uma unidade específica no modal.
 * @param {string} locationId - O ID da unidade (ex: "apt-215").
 * @param {string} aptNumberText - O número do apartamento para exibir no título.
 */
async function showOsForApartment(locationId, aptNumberText) {
    if (!viewOsModal) return;

    modalAptNumber.textContent = `Apto ${aptNumberText}`;
    modalOsList.innerHTML = '<p class="text-gray-500">A carregar...</p>'; // Feedback de carregamento
    viewOsModal.classList.remove('hidden');

    const osCollectionRef = collection(db, 'ordens_de_servico');
    const q = query(osCollectionRef, where("locationId", "==", locationId));

    try {
        const querySnapshot = await getDocs(q);
        modalOsList.innerHTML = ''; // Limpa a mensagem "A carregar"

        if (querySnapshot.empty) {
            modalOsList.innerHTML = '<p class="text-gray-500">Nenhuma Ordem de Serviço encontrada para esta unidade.</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const os = doc.data();
            const osCard = document.createElement('div');
            osCard.className = 'p-4 border rounded-lg';

            const priorityColors = { 'Alta': 'border-red-500', 'Média': 'border-yellow-500', 'Baixa': 'border-blue-500' };
            const statusColors = { 'Aberta': 'text-blue-600', 'Em Andamento': 'text-purple-600', 'Concluída': 'text-gray-600' };

            osCard.classList.add(priorityColors[os.priority] || 'border-gray-300');

            osCard.innerHTML = `
                <p class="font-semibold text-gray-800">${os.description}</p>
                <div class="flex justify-between items-center mt-2 text-sm">
                    <span class="font-bold ${statusColors[os.status] || ''}">${os.status}</span>
                    <span class="text-gray-500">${os.createdAt ? os.createdAt.toDate().toLocaleDateString('pt-BR') : ''}</span>
                </div>
            `;

            osCard.classList.add('cursor-pointer', 'hover:bg-gray-50'); // Torna-o visualmente clicável
            osCard.addEventListener('click', () => {
                openEditModal(doc.id, os);
            });

            modalOsList.appendChild(osCard);
        });

    } catch (error) {
        console.error("Erro ao buscar O.S. da unidade:", error);
        modalOsList.innerHTML = '<p class="text-red-500">Ocorreu um erro ao carregar as Ordens de Serviço.</p>';
    }
}


/**
 * Passo 4: Renderiza a planta do prédio, usando os dados das O.S. para colorir os apartamentos.
 * @param {object} osData - A nossa "lista de resumo" de O.S. por apartamento.
 */
function renderBuilding(osData) {
    const container = document.getElementById('floors-container');
    if (!container) return;
    container.innerHTML = '';

    building.floors.sort((a, b) => a.level - b.level);

    building.floors.forEach(floor => {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'mb-8 bg-white p-4 sm:p-6 rounded-xl shadow-sm fade-in';

        const floorTitle = document.createElement('h2');
        floorTitle.className = 'text-xl font-semibold mb-4 text-gray-700';
        floorTitle.textContent = floor.name;
        floorDiv.appendChild(floorTitle);

        const apartmentsGrid = document.createElement('div');
        apartmentsGrid.className = 'grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-13 gap-3';

        for (let i = 1; i <= floor.apartments; i++) {
            // Gera o ID e o texto do apartamento
            let aptNumberText;
            if (floor.level === 0) aptNumberText = String(i).padStart(3, '0');
            else aptNumberText = `${floor.level}${10 + i}`;
            const locationId = `apt-${aptNumberText}`;

            // Verifica na nossa lista de resumo se este apartamento tem alguma O.S.
            const osInfo = osData[locationId];

            const aptButton = document.createElement('button');
            let buttonClasses = 'p-2 rounded-lg text-center font-medium transition-colors duration-200 aspect-square flex items-center justify-center relative';

            // Aplica cores e o emblema de contagem se houver O.S.
            if (osInfo) {
                switch (osInfo.highestPriority) {
                    case 'Alta':
                        buttonClasses += ' bg-red-200 text-red-800 border-red-400 border-2';
                        break;
                    case 'Média':
                        buttonClasses += ' bg-yellow-200 text-yellow-800 border-yellow-400 border-2';
                        break;
                    case 'Baixa':
                        buttonClasses += ' bg-blue-200 text-blue-800 border-blue-400 border-2';
                        break;
                }
                // Adiciona o emblema de contagem
                aptButton.innerHTML = `
                    ${aptNumberText}
                    <span class="absolute -top-2 -right-2 bg-gray-800 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        ${osInfo.count}
                    </span>
                `;
            } else {
                // Estilo padrão para apartamentos sem O.S.
                buttonClasses += ' bg-gray-200 text-gray-600 hover:bg-gray-300';
                aptButton.textContent = aptNumberText;
            }

            aptButton.className = buttonClasses;
            aptButton.onclick = () => {
                showOsForApartment(locationId, aptNumberText);
            };
            apartmentsGrid.appendChild(aptButton);
        }

        floorDiv.appendChild(apartmentsGrid);
        container.appendChild(floorDiv);
    });
}

/**
 * Função principal que orquestra a execução.
 */
async function main() {
    // Primeiro, busca e processa os dados
    const osDataByApartment = await fetchAndProcessOS();
    // Depois, renderiza a planta com esses dados
    renderBuilding(osDataByApartment);
}

// --- Event Listeners para o Modal de Visualização ---
closeModalBtn?.addEventListener('click', () => {
    viewOsModal.classList.add('hidden');
});

viewOsModal?.addEventListener('click', (event) => {
    // Fecha o modal apenas se o clique for no fundo escuro (o overlay)
    if (event.target === viewOsModal) {
        viewOsModal.classList.add('hidden');
    }
});

/**
 * Abre o modal de detalhes/edição e preenche com os dados da O.S.
 * @param {string} id - O ID do documento da O.S. no Firestore.
 * @param {object} osData - Os dados da O.S.
 */
function openEditModal(id, osData) {
    if (!editOsModal) return;

    const photoContainer = document.getElementById('edit-os-photo-container');
    const photoLink = document.getElementById('edit-os-photo-link');
    const photoImg = document.getElementById('edit-os-photo-img');

    document.getElementById('edit-os-id').value = id;
    document.getElementById('edit-os-location').textContent = osData.locationName;
    document.getElementById('edit-os-description').textContent = osData.description;
    document.getElementById('edit-os-priority').textContent = osData.priority;
    document.getElementById('edit-os-status').value = osData.status;

    if (osData.photoURL && osData.photoURL !== "") {
        photoImg.src = osData.photoURL;
        photoLink.href = osData.photoURL;
        photoContainer.classList.remove('hidden');
    } else {
        photoContainer.classList.add('hidden');
    }

    // Esconde o formulário de edição de status, pois aqui é só visualização
    const statusSelect = document.getElementById('edit-os-status');
    const formActions = editOsModal.querySelector('.flex.justify-end');
    if (statusSelect) statusSelect.parentElement.style.display = 'none';
    if (formActions) formActions.style.display = 'none';


    editOsModal.classList.remove('hidden');
}

// --- Event Listeners para o Modal de Edição ---
closeEditModalBtn?.addEventListener('click', () => {
    editOsModal.classList.add('hidden');
});

editOsModal?.addEventListener('click', (event) => {
    if (event.target === editOsModal) {
        editOsModal.classList.add('hidden');
    }
});


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', main);
