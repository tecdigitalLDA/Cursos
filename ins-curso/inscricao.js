// Ficheiro: inscricao.js (Versão Corrigida e Final)

// Declara as variáveis no escopo global do script para que todas as funções as possam aceder
let form, provinceSelect, municipalitySelect;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa as variáveis quando o documento estiver pronto
    form = document.getElementById('registrationForm');
    provinceSelect = document.getElementById('province');
    municipalitySelect = document.getElementById('municipality');

    // --- LÓGICA DOS MENUS DINÂMICOS ---
    const municipiosPorProvincia = {
        "Huambo": ["Huambo", "Bailundo", "Caála", "Catchiungo", "Chicala-Cholohanga", "Ekunha", "Londuimbale", "Longonjo", "Mungo", "Tchindjenje", "Ukuma"],
        "Luanda": ["Belas", "Cacuaco", "Cazenga", "Ícolo e Bengo", "Luanda", "Quiçama", "Talatona", "Viana"],
        "Benguela": ["Baía Farta", "Balombo", "Benguela", "Bocoio", "Caimbambo", "Catumbela", "Chongorói", "Cubal", "Ganda", "Lobito"],
        "Huíla": ["Caconda", "Cacula", "Caluquembe", "Chiange", "Chibia", "Chicomba", "Chipindo", "Cuvango", "Humpata", "Jamba", "Lubango", "Matala", "Quilengues", "Quipungo"],
        "Bié": ["Andulo", "Camacupa", "Catabola", "Chinguar", "Chitembo", "Cuemba", "Cunhinga", "Kuito", "Nharea"]
    };

    for (const provincia in municipiosPorProvincia) {
        provinceSelect.options[provinceSelect.options.length] = new Option(provincia, provincia);
    }

    provinceSelect.addEventListener('change', function() {
        municipalitySelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        municipalitySelect.disabled = true;

        const selectedProvince = this.value;
        if (selectedProvince) {
            const municipios = municipiosPorProvincia[selectedProvince];
            municipios.forEach(municipio => {
                municipalitySelect.options[municipalitySelect.options.length] = new Option(municipio, municipio);
            });
            municipalitySelect.disabled = false;
        }
    });

    // --- LÓGICA DE VALIDAÇÃO ---
    form.addEventListener('submit', async function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            await handleFormSubmit(event);
        }
        form.classList.add('was-validated');
    }, false);
});

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) resolve(null);
        const reader = new FileReader();
        reader.onload = (event) => resolve({
            fileName: file.name,
            mimeType: file.type,
            fileContent: event.target.result.split(',')[1]
        });
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// Ficheiro: ins-curso/inscricao.js
// Ficheiro: ins-curso/inscricao.js
// Ação: Substitua toda a sua função handleFormSubmit por esta

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitButton = document.getElementById('submitButton');
    const spinner = document.getElementById('spinner');
    // Certifique-se de que os seus divs de alerta no inscricao.html têm estes IDs
    const alertSuccess = document.getElementById('alert-sucesso');
    const alertFail = document.getElementById('alert-falha');
    
    // Esconde as mensagens antigas e mostra o spinner
    if(alertSuccess) alertSuccess.style.display = 'none';
    if(alertFail) alertFail.style.display = 'none';
    if(spinner) spinner.style.display = 'inline-block';
    if(submitButton) submitButton.disabled = true;

    try {
        // Certifique-se de que a sua URL está correta aqui
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbzAw3fdX_hb9i9G7xVihx3mb6Rs70Ix81lNGOg3wTmG8btm_rajmCCSCCsaTn0U145t/exec';

        const urlParams = new URLSearchParams(window.location.search);
        const courseName = urlParams.get('course') || 'Curso não especificado';

        const idFile = document.getElementById('identityDocument').files[0];
        const paymentFile = document.getElementById('paymentProof').files[0];

        // Espera que os dois ficheiros sejam lidos e convertidos
        const [idFileData, paymentFileData] = await Promise.all([
            readFileAsBase64(idFile),
            readFileAsBase64(paymentFile)
        ]);

        // Cria o payload com os dados do aluno
        const studentPayload = {
            courseName: courseName,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            biNumber: document.getElementById('biNumber').value,
            email: document.getElementById('email').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            province: document.getElementById('province').value,
            municipality: document.getElementById('municipality').value,
            identityDocument: idFileData,
            paymentProof: paymentFileData
        };
        
        // Cria o payload final com a "action" que o backend espera
        const finalPayload = {
            action: 'handlePublicInscription',
            payload: studentPayload
        };

        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: JSON.stringify(finalPayload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`O servidor respondeu com um erro: ${response.statusText}`);
        }

        const result = await response.json(); // Esta linha agora não deve dar erro

        if (result.status === 'success') {
            if(alertSuccess) {
                alertSuccess.innerHTML = `<strong>Sucesso!</strong> ${result.message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
                alertSuccess.style.display = 'block';
            }
            if(form) {
                form.reset();
                form.classList.remove('was-validated');
            }
            if(municipalitySelect) municipalitySelect.disabled = true;

            // Envia a mensagem para a página principal fechar o modal
            setTimeout(() => {
                window.parent.postMessage('closeModal', '*');
            }, 5000);

        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Erro no processo de inscrição:', error);
        if(alertFail) {
            alertFail.innerHTML = `<strong>Erro!</strong> ${error.message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
            alertFail.style.display = 'block';
        }
        
    } finally {
        // Garante que o botão volta ao normal, quer haja sucesso ou erro
        if(spinner) spinner.style.display = 'none';
        if(submitButton) submitButton.disabled = false;
    }
}