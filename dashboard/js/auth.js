// js/auth.js
const validCredentials = {
    "tecdigital61@gmail.com": "tecdigital.2023",
    "chimuco.geral@gmail.com": "#Edson2017"
};

async function showLoginModal() {
    const modalContainer = document.getElementById('modal-container');
    const response = await fetch('components/login-modal.html');
    modalContainer.innerHTML = await response.text();

    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();

    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById('floatingInput').value;
        const password = document.getElementById('floatingPassword').value;

        if (validCredentials[email] && validCredentials[email] === password) {
            sessionStorage.setItem("isLoggedIn", "true");
            loginModal.hide();
            checkAuth();
        } else {
            alert('Credenciais inválidas.');
        }
    });
}

export function checkAuth() {
    if (sessionStorage.getItem("isLoggedIn") === "true") {
        document.getElementById('dashboard-container').classList.remove('d-none');
        document.getElementById('modal-container').innerHTML = '';
    } else {
        document.getElementById('dashboard-container').classList.add('d-none');
        showLoginModal();
    }
}

export function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.hash = "";
    window.location.reload();
}