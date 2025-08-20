// js/navigation.js
import { logout } from './auth.js';

const routes = {
    "/visao-geral": "pages/visao-geral.html",
    "/aprovacoes": "pages/aprovacoes.html",
    "/inscricoes": "pages/inscricoes.html",
    "/nova-inscricao": "pages/nova-inscricao.html",
    "/alunos": "pages/alunos.html", // <<< Alunos
    "/financas": "pages/financas.html",
    "/salas-online": "pages/salas-online.html",
};
 
const mainContent = document.getElementById("main-content");

/**
 * Função melhorada para carregar o HTML e EXECUTAR os scripts contidos nele.
 * Esta é a correção principal para o problema.
 */
const loadPage = async (path) => {
    try {
        mainContent.innerHTML = '<p class="p-4">A carregar...</p>';
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Página não encontrada: ${path}`);
        
        const html = await response.text();
        mainContent.innerHTML = html;

        // Encontra todas as tags <script> no HTML que foi carregado
        const scripts = mainContent.querySelectorAll("script");
        
        // Executa cada script encontrado
        scripts.forEach(script => {
            const newScript = document.createElement("script");
            // Copia o conteúdo do script original para o novo
            newScript.textContent = script.textContent;
            // Adiciona o novo script ao final do body para que seja executado
            document.body.appendChild(newScript).remove(); // .remove() limpa o script após a execução
        });

    } catch (error) {
        mainContent.innerHTML = `<div class="alert alert-danger m-4">${error.message}</div>`;
    }
};

function handleNavigation() {
    const hash = window.location.hash.substring(1) || "/visao-geral";
    const path = routes[hash];
    if (sessionStorage.getItem("isLoggedIn") === "true") {
        loadPage(path || 'pages/404.html');
    }
}

export function initNavigation() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    window.addEventListener("hashchange", handleNavigation);
    // Não chama handleNavigation aqui, pois o auth.js já o faz após o login
}
