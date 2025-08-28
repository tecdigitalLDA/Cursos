const webAppUrl = 'https://script.google.com/macros/s/AKfycbzAw3fdX_hb9i9G7xVihx3mb6Rs70Ix81lNGOg3wTmG8btm_rajmCCSCCsaTn0U145t/exec'; // IMPORTANTE

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
});

// Função para buscar os dados da turma
async function fetchClassroomData(classId, studentEmail) {
    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'getClassroomDetails',
                payload: { classId, studentEmail }
            }),
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors'
        });

        const result = await response.json();
        if (result.status === 'success') {
            renderClassroom(result.data);
        } else {
            throw new Error(result.message || 'Erro ao buscar dados da turma.');
        }
    } catch (error) {
        document.getElementById('main').innerHTML = 
            `<div class="alert alert-danger m-5">${error.message}</div>`;
    }
}

// Função para renderizar a turma e os vídeos
function renderClassroom(data) {
    if (!data || !data.classDetails) {
        document.getElementById('main').innerHTML =
            `<div class="alert alert-warning m-5">Nenhum detalhe da turma disponível.</div>`;
        return;
    }

    // Atualiza os títulos
    document.getElementById('classroom-title').textContent = data.classDetails.className || 'Turma sem nome';
    document.getElementById('classroom-subtitle').textContent = `Curso de ${data.classDetails.courseName || ''}`;

    // Renderiza a lista de vídeos
    const videoList = document.getElementById('video-list');
    if (!data.videos || data.videos.length === 0) {
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
