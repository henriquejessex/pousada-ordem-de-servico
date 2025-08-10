// Importa as ferramentas do Firebase que vamos usar
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const auth = getAuth(app); // Obtém a referência do serviço de Autenticação

// --- Lógica do Login ---
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = loginForm.username.value; // Pega no nome de utilizador
    const password = loginForm.password.value;

    // O "TRUQUE": Adiciona o nosso domínio interno ao nome de utilizador
    const email = `${username.toLowerCase()}@pousada.app`;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Login bem-sucedido!
            console.log("Utilizador autenticado:", userCredential.user);
            // Redireciona para o dashboard
            window.location.href = 'index.html';
        })
        .catch((error) => {
            // Ocorreu um erro
            console.error("Erro de autenticação:", error.code, error.message);
            errorMessage.textContent = "Email ou senha inválidos. Tente novamente.";
        });
});
