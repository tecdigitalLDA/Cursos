document.addEventListener("DOMContentLoaded", () => {
    const loginModal = document.getElementById("loginModal");
    const mainContent = document.getElementById("main-content");
    const logoutButton = document.getElementById("logoutButton");

    const validCredentials = {
        "tecdigital61@gmail.com": "tecdigital.2023",
        "chimuco.geral@gmail.com": "#Edosn2017"
    };

    const routes = {
        "/visao-geral": "pages/visao-geral.html",
        "/inscricoes": "pages/inscricoes.html",
    };

    const loadPage = async (path) => {
        try {
            mainContent.innerHTML = '<p class="p-4">A carregar...</p>';
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Página não encontrada: ${path}`);
            mainContent.innerHTML = await response.text();
        } catch (error) {
            mainContent.innerHTML = `<div class="alert alert-danger m-4">${error.message}</div>`;
        }
    };

    const handleNavigation = () => {
        const hash = window.location.hash.substring(1) || "/visao-geral";
        const path = routes[hash];
        loadPage(path || 'pages/404.html');
    };
    
    const checkAuth = async () => {
        if (sessionStorage.getItem("isLoggedIn") === "true") {
            loginModal.style.display = "none";
            handleNavigation();
        } else {
            loginModal.style.display = "flex";
            try {
                const response = await fetch("index.html");
                if (!response.ok) throw new Error("O ficheiro de login 'index.html' não foi encontrado.");

                document.querySelector(".login-modal-content").innerHTML = await response.text();
                
                const loginForm = document.getElementById("loginForm");
                loginForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const email = document.getElementById('floatingInput').value;
                    const password = document.getElementById('floatingPassword').value;

                    if (validCredentials[email] && validCredentials[email] === password) {
                        sessionStorage.setItem("isLoggedIn", "true");
                        checkAuth();
                    } else {
                        let errorDiv = document.getElementById('loginError');
                        if (!errorDiv) {
                            errorDiv = document.createElement('p');
                            errorDiv.id = 'loginError';
                            errorDiv.className = 'text-danger mt-3 text-center';
                            loginForm.appendChild(errorDiv);
                        }
                        errorDiv.textContent = 'Email ou senha inválidos.';
                    }
                });
            } catch (error) {
                document.querySelector(".login-modal-content").innerHTML = `<p class="text-danger p-4"><b>Erro:</b> ${error.message}</p>`;
            }
        }
    };

    logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("isLoggedIn");
        window.location.hash = "";
        window.location.reload();
    });

    window.addEventListener("hashchange", checkAuth);

    checkAuth();
});