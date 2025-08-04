// Este ficheiro serve como uma "fonte única da verdade" para a estrutura da pousada.
// Qualquer alteração nos locais deve ser feita aqui.

const allLocations = [
    {
        group: 'Prédio Principal',
        floors: [{ level: 2, apartments: 13 }, { level: 1, apartments: 13 }, { level: 0, apartments: 13 }]
        // INSERIR CAIXA DÁGUA
    },
    {
        group: 'Prédio Anexo',
        floors: [{ level: 1, apartments: 12 }, { level: 0, apartments: 6 }]
        // INSERIR CAIXA DAGUA
    },
    {
        group: 'Área Externa',
        items: [
            { id: "salao-tv", name: "SALÃO DE TV" },
            { id: "salao-jogos", name: "SALÃO DE JOGOS" },
            { id: "brinquedoteca", name: "BRINQUEDOTECA" },
            { id: "estacionamento-geral", name: "ESTACIONAMENTO" },
            { id: "caixas-dagua", name: "CAIXAS D'ÁGUA" }
        ]
    },
    {
        group: 'Piscinas',
        items: [
            { id: "piscina-climatizada", name: "PISCINA CLIMATIZADA" },
            { id: "piscina-mario", name: "PISCINA MARIO" },
            { id: "jacuzzi", name: "JACUZZI" },
            { id: "piscina-frente-praia", name: "PISCINA FRENTE PRAIA" },
            { id: "jacuzzi-frente-praia", name: "JACUZZI FRENTE PRAIA" }
        ]
    },
    {
        group: 'Cozinha',
        items: [
            { id: "restaurante", name: "RESTAURANTE" },
            { id: "freezers", name: "FREEZERS" },
            { id: "pias", name: "PIAS" },
            { id: "fogao", name: "FOGÃO" },
            { id: "forno", name: "FORNO" },
            { id: "microondas", name: "MICROONDAS" },
            { id: "geladeira", name: "GELADEIRA" },
            { id: "exaustor", name: "EXAUSTOR" },
            { id: "luminarias", name: "LUMINÁRIAS" },
        ]
    }
];

// A palavra-chave 'export' torna esta variável acessível a outros ficheiros que a importem.
export { allLocations };
