// Importa as funções do Firebase que vamos usar
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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

// guarda todas as do DOM
let todasAsOrdens = []; // Guarda a lista completa de O.S.

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DO DOM ---
    const osTableBody = document.getElementById('os-table-body');
    const kpiOsAbertas = document.getElementById('kpi-os-abertas');
    const kpiPrioridadeAlta = document.getElementById('kpi-prioridade-alta');
    const kpiConcluidasHoje = document.getElementById('kpi-concluidas-hoje');
    const cardOsAbertas = document.getElementById('card-os-abertas');
    const showAllBtn = document.getElementById('show-all-btn');

    // Modal de Criação
    const newOsModal = document.getElementById('new-os-modal');
    const openNewOsBtn = document.getElementById('open-new-os-btn');
    const closeNewOsModalBtn = document.getElementById('close-new-modal-btn');
    const cancelNewOsBtn = document.getElementById('cancel-new-btn');
    const newOsForm = document.getElementById('new-os-form');
    const locationSelect = document.getElementById('os-location');

    // Modal de Edição
    const editOsModal = document.getElementById('edit-os-modal');
    const closeEditOsModalBtn = document.getElementById('close-edit-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editOsForm = document.getElementById('edit-os-form');

    // --- DADOS PARA PREENCHER O DROPDOWN DE LOCAIS ---
    const allLocations = [
        {
            group: 'Prédio Principal',
            floors: [{ level: 2, apartments: 13 }, { level: 1, apartments: 13 }, { level: 0, apartments: 13 }]
        },
        {
            group: 'Prédio Anexo',
            floors: [{ level: 1, apartments: 12 }, { level: 0, apartments: 6 }]
        },
        {
            group: 'Áreas Comuns',
            items: [
                { id: "piscina-adulto-bomba", name: "Piscina - Bomba Adulto" },
                { id: "piscina-adulto-aquecedor", name: "Piscina - Aquecedor Adulto" },
                { id: "sauna-umida", name: "Área Lazer - Sauna Úmida" },
                { id: "estacionamento-portao", name: "Estacionamento - Portão" },
                { id: "cozinha-fogao", name: "Cozinha - Fogão Industrial" },
                { id: "area-externa-jardim", name: "Área Externa - Jardim Principal" },
            ]
        }
    ];

    // --- FUNÇÕES ---

    /**
 * Renderiza a tabela de O.S. com base numa lista de documentos.
 * @param {Array} osDocs - A lista de documentos de O.S. para exibir.
 */
    function renderOSTable(osDocs) {
        if (!osTableBody) return;
        osTableBody.innerHTML = '';

        if (osDocs.length === 0) {
            osTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhuma ordem de serviço encontrada para este filtro.</td></tr>';
            return;
        }

        osDocs.forEach(doc => {
            const os = doc.data();
            const tr = document.createElement('tr');
            tr.className = 'cursor-pointer hover:bg-gray-50';
            tr.dataset.id = doc.id;

            const dataCriacao = os.createdAt ? os.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/D';
            const priorityColors = { 'Alta': 'bg-red-100 text-red-800', 'Média': 'bg-yellow-100 text-yellow-800', 'Baixa': 'bg-green-100 text-green-800' };
            const statusColors = { 'Aberta': 'bg-blue-100 text-blue-800', 'Em Andamento': 'bg-purple-100 text-purple-800', 'Concluída': 'bg-gray-200 text-gray-800' };

            tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${os.locationName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${os.description}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[os.priority] || ''}">${os.priority}</span></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[os.status] || ''}">${os.status}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dataCriacao}</td>
        `;
            tr.addEventListener('click', () => openEditModal(doc.id, os));
            osTableBody.appendChild(tr);
        });
    }

    function fetchAndDisplayOS() {
        const osCollectionRef = collection(db, 'ordens_de_servico');
        const q = query(osCollectionRef, orderBy('createdAt', 'desc'));

        onSnapshot(q, (snapshot) => {
            let osAbertasCount = 0;
            let prioridadeAltaCount = 0;
            let concluidasHojeCount = 0;
            const hoje = new Date().toDateString();

            todasAsOrdens = snapshot.docs; // Guarda a lista completa

            snapshot.forEach(doc => {
                const os = doc.data();
                if (os.status !== 'Concluída') {
                    osAbertasCount++;
                    if (os.priority === 'Alta') {
                        prioridadeAltaCount++;
                    }
                } else if (os.completedAt && os.completedAt.toDate().toDateString() === hoje) {
                    concluidasHojeCount++;
                }
            });

            // Renderiza a tabela com todas as O.S. por defeito
            renderOSTable(todasAsOrdens);

            // Atualiza os KPIs
            if (kpiOsAbertas) kpiOsAbertas.textContent = osAbertasCount;
            if (kpiPrioridadeAlta) kpiPrioridadeAlta.textContent = prioridadeAltaCount;
            if (kpiConcluidasHoje) kpiConcluidasHoje.textContent = concluidasHojeCount;
        });
    }

    async function saveOS(osData) {
        try {
            await addDoc(collection(db, 'ordens_de_servico'), osData);
            alert("Ordem de Serviço salva com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar a Ordem de Serviço: ", error);
            alert("Ocorreu um erro ao salvar a O.S. Verifique o console para mais detalhes.");
        }
    }

    async function updateOS(id, updatedData) {
        const osDocRef = doc(db, 'ordens_de_servico', id);
        try {
            if (updatedData.status === 'Concluída') {
                updatedData.completedAt = serverTimestamp();
            }
            await updateDoc(osDocRef, updatedData);
            alert("Status da O.S. atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar a O.S.: ", error);
            alert("Ocorreu um erro ao atualizar a O.S.");
        }
    }

    function populateLocations() {
        if (!locationSelect) return;
        locationSelect.innerHTML = '<option value="" disabled selected>Selecione um local...</option>';
        allLocations.forEach(locationGroup => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = locationGroup.group;
            if (locationGroup.floors) {
                locationGroup.floors.sort((a, b) => a.level - b.level).forEach(floor => {
                    for (let i = 1; i <= floor.apartments; i++) {
                        let aptNumberText;
                        if (locationGroup.group === 'Prédio Principal') {
                            if (floor.level === 0) aptNumberText = String(i).padStart(3, '0');
                            else aptNumberText = `${floor.level}${10 + i}`;
                        } else if (locationGroup.group === 'Prédio Anexo') {
                            if (floor.level === 0) aptNumberText = String(13 + i).padStart(3, '0');
                            else aptNumberText = `${floor.level}${23 + i}`;
                        }
                        const option = document.createElement('option');
                        option.value = `apt-${aptNumberText}`;
                        option.textContent = `Apto ${aptNumberText}`;
                        optgroup.appendChild(option);
                    }
                });
            } else if (locationGroup.items) {
                locationGroup.items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = item.name;
                    optgroup.appendChild(option);
                });
            }
            locationSelect.appendChild(optgroup);
        });
    }

    // --- FUNÇÕES DE CONTROLO DOS MODAIS ---
    function openNewModal() { newOsModal?.classList.remove('hidden'); }
    function closeNewModal() { newOsModal?.classList.add('hidden'); }
    function openEditModal(id, osData) {
        if (!editOsModal) return;

        // Obtém os elementos do modal de edição
        const photoContainer = document.getElementById('edit-os-photo-container');
        const photoLink = document.getElementById('edit-os-photo-link');
        const photoImg = document.getElementById('edit-os-photo-img');

        // Preenche os campos de texto como antes
        document.getElementById('edit-os-id').value = id;
        document.getElementById('edit-os-location').textContent = osData.locationName;
        document.getElementById('edit-os-description').textContent = osData.description;
        document.getElementById('edit-os-priority').textContent = osData.priority;
        document.getElementById('edit-os-status').value = osData.status;

        // ... (depois de preencher os campos do modal) ...

        const statusSelect = document.getElementById('edit-os-status');
        const completedPhotoUploadContainer = document.getElementById('completed-photo-upload-container');

        // Mostra/esconde o campo de upload de foto de conclusão
        statusSelect.addEventListener('change', () => {
            if (statusSelect.value === 'Concluída') {
                completedPhotoUploadContainer.classList.remove('hidden');
            } else {
                completedPhotoUploadContainer.classList.add('hidden');
            }
        });

        // Lógica para mostrar a foto
        if (osData.photoURL && osData.photoURL !== "") {
            // Se existe um URL de foto...
            photoImg.src = osData.photoURL;      // Define a fonte da imagem
            photoLink.href = osData.photoURL;    // Define o link para abrir em nova aba
            photoContainer.classList.remove('hidden'); // Mostra o contentor da imagem
        } else {
            // Se não existe um URL de foto...
            photoContainer.classList.add('hidden'); // Garante que o contentor está escondido
        }

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

        // --- Lógica para Materiais e Prazo Final ---
        const materiaisContainer = document.getElementById('edit-os-materiais-container');
        const materiaisText = document.getElementById('edit-os-materiais');
        const prazoContainer = document.getElementById('edit-os-prazo-container');
        const prazoText = document.getElementById('edit-os-prazo');

        // Mostra os materiais se existirem
        if (osData.materiais && osData.materiais.trim() !== "") {
            materiaisText.textContent = osData.materiais;
            materiaisContainer.classList.remove('hidden');
        } else {
            materiaisContainer.classList.add('hidden');
        }

        // Mostra o prazo se existir
        if (osData.prazoFinal) {
            // Formata a data para o formato local (dd/mm/yyyy)
            const dataFormatada = new Date(osData.prazoFinal).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            prazoText.textContent = dataFormatada;
            prazoContainer.classList.remove('hidden');
        } else {
            prazoContainer.classList.add('hidden');
        }

        // Mostra o modal
        editOsModal.classList.remove('hidden');
    }

    function closeEditModal() { editOsModal?.classList.add('hidden'); }

    // --- EVENT LISTENERS ---
    newOsForm?.addEventListener('submit', async (event) => { // <-- Adicionado 'async'
        event.preventDefault();

        const submitButton = newOsForm.querySelector('button[type="submit"]');
        const selectedOption = locationSelect.options[locationSelect.selectedIndex];
        if (!selectedOption || selectedOption.value === "") {
            alert("Por favor, selecione um local.");
            return;
        }

        const photoFile = document.getElementById('os-photo').files[0];
        let photoURL = ""; // Começa com URL vazia por defeito

        // Desativa o botão e mostra um feedback ao utilizador
        submitButton.disabled = true;
        submitButton.textContent = 'A Guardar...';

        try {
            // Passo 1: Se o utilizador selecionou uma foto, faz o upload
            if (photoFile) {
                // Cria um nome de ficheiro único para evitar que uma foto substitua outra
                const filePath = `os-photos/${Date.now()}-${photoFile.name}`;
                const storageRef = ref(storage, filePath);

                // Envia o ficheiro para o Firebase Storage
                const snapshot = await uploadBytes(storageRef, photoFile);

                // Pega no link público (URL) da imagem que acabámos de enviar
                photoURL = await getDownloadURL(snapshot.ref);
                console.log("Foto enviada com sucesso:", photoURL);
            }

            // Passo 2: Cria o objeto da O.S. com o link da foto (se existir)
            const newOS = {
                locationId: locationSelect.value,
                locationName: selectedOption.text,
                description: newOsForm.description.value,
                priority: newOsForm.priority.value,
                status: 'Aberta',
                createdAt: serverTimestamp(),
                photoURL: photoURL, // Guarda o link da foto no banco de dados
                materiais: newOsForm.materiais.value,
                prazoFinal: newOsForm.prazoFinal.value
            };

            // Passo 3: Salva a O.S. completa no Firestore
            await saveOS(newOS);

            newOsForm.reset();
            closeNewModal();

        } catch (error) {
            console.error("Erro no processo de criação da O.S.:", error);
            alert("Ocorreu um erro ao criar a O.S. Verifique a consola.");
        } finally {
            // Restaura o botão, quer o processo tenha sucesso ou falhe
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar O.S.';
        }
    });

    editOsForm?.addEventListener('submit', async (event) => { // <-- Adicionado 'async'
        event.preventDefault();

        const submitButton = editOsForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'A Guardar...';

        try {
            const id = document.getElementById('edit-os-id').value;
            const newStatus = document.getElementById('edit-os-status').value;
            const completedPhotoFile = document.getElementById('os-completed-photo').files[0];

            let updatedData = {
                status: newStatus
            };

            // Se o status for "Concluída", adiciona a data de conclusão
            if (newStatus === 'Concluída') {
                updatedData.completedAt = serverTimestamp();
            }

            // Se uma foto de conclusão foi enviada, faz o upload
            if (completedPhotoFile) {
                const filePath = `os-completed-photos/${Date.now()}-${completedPhotoFile.name}`;
                const storageRef = ref(storage, filePath);
                const snapshot = await uploadBytes(storageRef, completedPhotoFile);
                const completedPhotoURL = await getDownloadURL(snapshot.ref);

                // Adiciona o URL da foto de conclusão aos dados a serem atualizados
                updatedData.completedPhotoURL = completedPhotoURL;
            }

            await updateOS(id, updatedData);
            closeEditModal();

        } catch (error) {
            console.error("Erro ao atualizar a O.S.:", error);
            alert("Ocorreu um erro ao atualizar a O.S.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });

    openNewOsBtn?.addEventListener('click', openNewModal);
    closeNewOsModalBtn?.addEventListener('click', closeNewModal);
    cancelNewOsBtn?.addEventListener('click', closeNewModal);
    newOsModal?.addEventListener('click', (e) => { if (e.target === newOsModal) closeNewModal(); });

    closeEditOsModalBtn?.addEventListener('click', closeEditModal);
    cancelEditBtn?.addEventListener('click', closeEditModal);
    editOsModal?.addEventListener('click', (e) => { if (e.target === editOsModal) closeEditModal(); });

    cardOsAbertas?.addEventListener('click', () => {
        // Filtra a lista para mostrar apenas as que não estão concluídas
        const osAbertas = todasAsOrdens.filter(doc => doc.data().status !== 'Concluída');
        renderOSTable(osAbertas);
        showAllBtn?.classList.remove('hidden'); // Mostra o botão para limpar o filtro
    });

    showAllBtn?.addEventListener('click', () => {
        // Renderiza a tabela com a lista completa novamente
        renderOSTable(todasAsOrdens);
        showAllBtn.classList.add('hidden'); // Esconde o botão
    });

    // --- INICIALIZAÇÃO ---
    populateLocations();
    fetchAndDisplayOS();
});
