const webAppUrl = 'https://script.google.com/macros/s/AKfycbxyHnW6rIT1lJ9dPBqnvKYZQ3KZ0IHZV_e_3g4dtgI98cyu8X7cbxrlOozF3o1srf8fyg/exec'; // IMPORTANTE

document.addEventListener('DOMContentLoaded', () => {
    // Lógica para o botão de logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('googleUserToken');
            sessionStorage.removeItem('studentName');
            alert("Sessão terminada.");
            window.location.href = 'turmas-online.html'; // Redireciona para a lista de turmas
    });
}

async function fetchClassroomData(classId, studentEmail) {
    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'getClassroomDetails',
                payload: { classId, studentEmail }
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors'
        });

        const result = await response.json();
        if (result.status === 'success') {
            renderClassroom(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        document.getElementById('main').innerHTML = `<div class="alert alert-danger m-5">${error.message}</div>`;
    }
}

function renderClassroom(data) {
    // Atualiza os títulos
    document.getElementById('classroom-title').textContent = data.classDetails.className;
    document.getElementById('classroom-subtitle').textContent = `Curso de ${data.classDetails.courseName}`;

    // Renderiza a lista de vídeos
    const videoList = document.getElementById('video-list');
    if (data.videos.length === 0) {
        videoList.innerHTML = '<p>Nenhuma aula gravada disponível no momento.</p>';
        return;
    }
    
    let videoHTML = '<div class="list-group">';
    data.videos.forEach(video => {
        videoHTML += `
            <a href="${video.url}" target="_blank" class="list-group-item list-group-item-action">
                <strong>▶</strong> ${video.name}
            </a>`;
    });
    videoHTML += '</div>';
    videoList.innerHTML = videoHTML;
}
