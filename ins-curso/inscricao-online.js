// Ficheiro: ins-curso/inscricao-online.js

// CONFIGURAÇÃO
// IMPORTANTE: Insira aqui o URL da sua API PÚBLICA (o mesmo que usou nos outros ficheiros públicos)
const webAppUrl = 'https://script.google.com/macros/s/AKfycbyhBE__0QRcutwH9Uq9SVS656fFJLgLV96M_4yOjHXTLQgxz83mNVPy5ezRxPC_mvYyZg/exec';

// Pega os parâmetros do URL para saber em que turma inscrever o aluno
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('classId');
const className = urlParams.get('className');
const statusDiv = document.getElementById('status-message');

// Atualiza o título da página para ser específico da turma
if (className) {
    document.getElementById('course-title-online').textContent = `Inscrição: ${className}`;
}

/**
 * Esta função é chamada automaticamente pelo botão do Google
 * após o utilizador fazer o login com sucesso.
 */
async function handleCredentialResponse(response) {
    statusDiv.innerHTML = '<div class="spinner-border spinner-border-sm"></div> A processar inscrição...';
    
    // Decodifica o token JWT que o Google envia para obter os dados do utilizador
    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
    
    const payload = {
        action: 'registerOnlineStudent',
        payload: {
            classId: classId,
            studentInfo: {
                email: decodedToken.email,
                name: decodedToken.name,
                given_name: decodedToken.given_name,    // Primeiro nome
                family_name: decodedToken.family_name // Apelido
            }
        }
    };

    try {
        const res = await fetch(webAppUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors'
        });

        if (!res.ok) {
            throw new Error("Ocorreu um erro na comunicação com o servidor.");
        }

        const result = await res.json();
        if (result.status === 'success') {
            statusDiv.innerHTML = `<div class="alert alert-success mt-3">${result.message}</div>`;
            // Opcional: fechar o modal da página principal após alguns segundos
            setTimeout(() => window.parent.postMessage('closeModal', '*'), 4000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        statusDiv.innerHTML = `<div class="alert alert-danger mt-3">${error.message}</div>`;
    }
}