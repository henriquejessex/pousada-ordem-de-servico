// --- DADOS (Prédio Anexo) ---
const building = {
    name: "Prédio Anexo",
    floors: [
        { name: "1º Andar", level: 1, apartments: 12 },
        { name: "Térreo", level: 0, apartments: 6 },
    ]
};

// --- FUNÇÃO DE RENDERIZAÇÃO ---
function renderBuilding() {
    const container = document.getElementById('floors-container');
    if (!container) {
        console.error('Elemento "floors-container" não encontrado no DOM.');
        return;
    }
    container.innerHTML = ''; // Limpa o conteúdo anterior

    // Garante que o array de andares esteja em ordem crescente (pelo 'level')
    building.floors.sort((a, b) => a.level - b.level);

    building.floors.forEach(floor => {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'mb-8 bg-white p-4 sm:p-6 rounded-xl shadow-sm fade-in';
        
        const floorTitle = document.createElement('h2');
        floorTitle.className = 'text-xl font-semibold mb-4 text-gray-700';
        floorTitle.textContent = floor.name;
        floorDiv.appendChild(floorTitle);

        const apartmentsGrid = document.createElement('div');
        apartmentsGrid.className = 'grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2';
        
        for (let i = 1; i <= floor.apartments; i++) {
            let aptNumberText;

            // Lógica de numeração específica para o Prédio Anexo
            if (floor.level === 0) {
                // Térreo: 014, 015, ..., 019
                aptNumberText = String(13 + i).padStart(3, '0');
            } else {
                // 1º Andar: 124, 125, ..., 135
                const suffix = 23 + i;
                aptNumberText = `${floor.level}${suffix}`;
            }
            
            const aptButton = document.createElement('button');
            aptButton.className = 'p-3 bg-gray-200 rounded-lg text-center font-medium text-gray-600 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-200 aspect-square flex items-center justify-center';
            aptButton.textContent = aptNumberText;
            
            aptButton.onclick = () => {
                console.log(`Apartamento ${aptNumberText} selecionado.`);
                alert(`Apartamento ${aptNumberText} selecionado. (Funcionalidade de exibir O.S. a ser implementada)`);
            };
            apartmentsGrid.appendChild(aptButton);
        }

        floorDiv.appendChild(apartmentsGrid);
        container.appendChild(floorDiv);
    });
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    renderBuilding();
});
