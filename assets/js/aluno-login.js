// Ficheiro: assets/js/aluno-login.js

// ***** IMPORTANTE: Insira aqui o seu URL da API Pública *****
const webAppUrl = 'https://script.google.com/macros/s/AKfycbxyHnW6rIT1lJ9dPBqnvKYZQ3KZ0IHZV_e_3g4dtgI98cyu8X7cbxrlOozF3o1srf8fyg/exec';

/**
 * Esta função é chamada pelo botão do Google após um login bem-sucedido.
 */
async function handleStudentLogin(response) {

    const result = await res.json();
        if (result.status === 'success' && result.data.length > 0) {
            statusDiv.innerHTML = '<p style="color: green;">Acesso concedido! A redirecionar...</p>';
            
            // ---> ALTERAÇÃO AQUI: Guarda o "token" na sessão do navegador <---
            sessionStorage.setItem('googleUserToken', response.credential);

            const firstClass = result.data[0];
            window.location.href = `sala-aula.html?classId=${firstClass.classId}`;

    
    const statusDiv = document.getElementById('login-status');
    statusDiv.innerHTML = '<p>A verificar acesso...</p>';

    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
    const studentEmail = decodedToken.email;

    const payload = {
        action: 'verifyAccess',
        payload: {
            email: studentEmail
        }
    };

    try {
        const res = await fetch(webAppUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors'
        });

        const result = await res.json();
        if (result.status === 'success' && result.data.length > 0) {
            statusDiv.innerHTML = '<p style="color: green;">Acesso concedido! A redirecionar...</p>';
            
            // Pega na primeira turma a que o aluno tem acesso
            const firstClass = result.data[0];

            // Redireciona o aluno para a sua sala de aula, passando o ID da turma no URL
            window.location.href = `sala-aula.html?classId=${firstClass.classId}`;

        } else {
            throw new Error(result.message || "Acesso falhou.");
        }
    } catch (error) {
        statusDiv.innerHTML = `<p style="color: red;"><strong>Erro:</strong> ${error.message}</p>`;
    }
}