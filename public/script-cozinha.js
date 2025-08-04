// Importa as ferramentas necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { allLocations } from './config.js';

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DADOS DA ÁREA DA PISCINA (Vêm da fonte da verdade) ---
// Passo 1: Encontra o objeto do grupo correto, que se chama 'Piscinas'.
const cozinhaData = allLocations.find(group => group.group === 'Cozinha');

// Passo 2: Pega na lista de 'items' diretamente desse objeto.
const cozinhaItems = cozinhaData ? cozinhaData.items : []; // Se o grupo for encontrado, pega nos items; senão, retorna uma lista vazia.

const area = {
    name: "Cozinha",
    items: cozinhaItems
};

// --- Elementos dos Modais ---
const viewOsModal = document.getElementById('view-os-modal');
const closeModalBtn = document.getElementById('close-view-modal-btn');
const modalItemName = document.getElementById('modal-item-name');
const modalOsList = document.getElementById('modal-os-list');
const editOsModal = document.getElementById('edit-os-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');

// (O resto dos elementos do edit-modal são obtidos dentro das funções)

async function fetchAndProcessOS() {
    const osDataByItem = {};
    const priorityOrder = { "Alta": 3, "Média": 2, "Baixa": 1 };
    const osCollectionRef = collection(db, 'ordens_de_servico');
    const q = query(osCollectionRef, where("status", "!=", "Concluída"));

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const os = doc.data();
            const locationId = os.locationId;
            if (!osDataByItem[locationId]) {
                osDataByItem[locationId] = { count: 0, highestPriority: "Baixa" };
            }
            osDataByItem[locationId].count++;
            if (priorityOrder[os.priority] > priorityOrder[osDataByItem[locationId].highestPriority]) {
                osDataByItem[locationId].highestPriority = os.priority;
            }
        });
        return osDataByItem;
    } catch (error) {
        console.error("Erro ao buscar as Ordens de Serviço: ", error);
        return {};
    }
}

function openEditModal(id, osData) {
    if (!editOsModal) return;

    // --- Lógica para a FOTO DO PROBLEMA (já existente) ---
    const photoContainer = document.getElementById('edit-os-photo-container');
    const photoLink = document.getElementById('edit-os-photo-link');
    const photoImg = document.getElementById('edit-os-photo-img');

    if (osData.photoURL && osData.photoURL !== "") {
        photoImg.src = osData.photoURL;
        photoLink.href = osData.photoURL;
        photoContainer.classList.remove('hidden');
    } else {
        photoContainer.classList.add('hidden');
    }

    // --- ADICIONE ESTE NOVO BLOCO DE CÓDIGO ---
    // Lógica para a FOTO DE CONCLUSÃO
    const completedPhotoContainer = document.getElementById('edit-os-completed-photo-container');
    const completedPhotoLink = document.getElementById('edit-os-completed-photo-link');
    const completedPhotoImg = document.getElementById('edit-os-completed-photo-img');

    if (osData.completedPhotoURL && osData.completedPhotoURL !== "") {
        completedPhotoImg.src = osData.completedPhotoURL;
        completedPhotoLink.href = osData.completedPhotoURL;
        completedPhotoContainer.classList.remove('hidden');
    } else {
        completedPhotoContainer.classList.add('hidden');
    }
    // --- FIM DO NOVO BLOCO ---

    // Preenche o resto dos campos
    document.getElementById('edit-os-id').value = id;
    document.getElementById('edit-os-location').textContent = osData.locationName;
    document.getElementById('edit-os-description').textContent = osData.description;
    document.getElementById('edit-os-priority').textContent = osData.priority;

    // Esconde a parte de edição, pois aqui é só visualização
    const statusSelect = document.getElementById('edit-os-status');
    const formActions = editOsModal.querySelector('.flex.justify-end');
    if (statusSelect) {
        statusSelect.value = osData.status; // Mostra o status atual
        statusSelect.parentElement.style.display = 'none'; // Mas esconde o dropdown
    }
    if (formActions) formActions.style.display = 'none'; // Esconde os botões de salvar/cancelar

    editOsModal.classList.remove('hidden');
}

async function showOsForItem(locationId, itemName) {
    if (!viewOsModal) return;
    modalItemName.textContent = itemName;
    modalOsList.innerHTML = '<p class="text-gray-500">A carregar...</p>';
    viewOsModal.classList.remove('hidden');

    const osCollectionRef = collection(db, 'ordens_de_servico');
    const q = query(osCollectionRef, where("locationId", "==", locationId));

    try {
        const querySnapshot = await getDocs(q);
        modalOsList.innerHTML = '';
        if (querySnapshot.empty) {
            modalOsList.innerHTML = '<p class="text-gray-500">Nenhuma Ordem de Serviço encontrada para este item.</p>';
            return;
        }
        querySnapshot.forEach(doc => {
            const os = doc.data();
            const osCard = document.createElement('div');
            osCard.className = 'p-4 border rounded-lg cursor-pointer hover:bg-gray-50';
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
            osCard.addEventListener('click', () => {
                // A função openEditModal precisa ser definida ou importada
                openEditModal(doc.id, os);
                // Por agora, vamos apenas logar para confirmar
                console.log("Abrir detalhes para a O.S.", doc.id);
            });
            modalOsList.appendChild(osCard);
        });
    } catch (error) {
        console.error("Erro ao buscar O.S. do item:", error);
        modalOsList.innerHTML = '<p class="text-red-500">Ocorreu um erro ao carregar as Ordens de Serviço.</p>';
    }
}


function renderArea(osData) {
    const container = document.getElementById('items-container');
    if (!container) return;
    container.innerHTML = '';

    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4';

    area.items.forEach(item => {
        const locationId = item.id;
        const osInfo = osData[locationId];
        const itemButton = document.createElement('button');
        let buttonClasses = 'p-4 rounded-lg text-left font-semibold transition-colors duration-200 shadow-sm relative flex items-center justify-center text-center h-24';

        if (osInfo) {
            switch (osInfo.highestPriority) {
                case 'Alta': buttonClasses += ' bg-red-100 text-red-800'; break;
                case 'Média': buttonClasses += ' bg-yellow-100 text-yellow-800'; break;
                case 'Baixa': buttonClasses += ' bg-blue-100 text-blue-800'; break;
            }
            itemButton.innerHTML = `
                ${item.name}
                <span class="absolute -top-2 -right-2 bg-gray-800 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                    ${osInfo.count}
                </span>
            `;
        } else {
            buttonClasses += ' bg-white text-gray-700 hover:bg-gray-50';
            itemButton.textContent = item.name;
        }

        itemButton.className = buttonClasses;
        itemButton.onclick = () => {
            showOsForItem(locationId, item.name);
        };
        itemsGrid.appendChild(itemButton);
    });
    container.appendChild(itemsGrid);
}

async function main() {
    const osDataByItem = await fetchAndProcessOS();
    renderArea(osDataByItem);
}

// --- Event Listeners para os Modais ---
closeModalBtn?.addEventListener('click', () => {
    viewOsModal.classList.add('hidden');
});
viewOsModal?.addEventListener('click', (event) => {
    if (event.target === viewOsModal) {
        viewOsModal.classList.add('hidden');
    }
});
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
