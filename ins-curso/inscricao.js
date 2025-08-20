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

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitButton = document.getElementById('submitButton');
    const spinner = document.getElementById('spinner');
    const alertSuccess = document.getElementById('alert-sucesso');
    const alertFail = document.getElementById('alert-falha');
    
    alertSuccess.style.display = 'none';
    alertFail.style.display = 'none';
    spinner.style.display = 'inline-block';
    submitButton.disabled = true;

    try {
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbydkdNQN0HJv-CbUwsVAH59o9gVXZ5salPbaFFrkGPknLWD9UcLDxHR71ZRXFrgMEUUoA/exec'; // ****** IMPORTANTE: Insira a sua URL ******

        const urlParams = new URLSearchParams(window.location.search);
        const courseName = urlParams.get('course') || 'Curso não especificado';

        const idFile = document.getElementById('identityDocument').files[0];
        const paymentFile = document.getElementById('paymentProof').files[0];

        const [idFileData, paymentFileData] = await Promise.all([
            readFileAsBase64(idFile),
            readFileAsBase64(paymentFile)
        ]);

        const payload = {
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
        
        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (!response.ok) {
            throw new Error(`O servidor respondeu com um erro: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === 'success') {
            alertSuccess.innerHTML = `<strong>Sucesso!</strong> Sua inscrição foi submetida com sucesso. Enviaremos um e-mail de confirmação se estiver tudo certo com os seus dados. <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
            alertSuccess.style.display = 'block';
            form.reset();
            form.classList.remove('was-validated');
            municipalitySelect.disabled = true; // Agora esta linha funciona

            setTimeout(() => {
                window.parent.postMessage('closeModal', '*');
            }, 5000);

        } else {
            throw new Error(data.message || "Ocorreu um erro desconhecido no servidor.");
        }

    } catch (error) {
        console.error('Erro no processo de inscrição:', error);
        alertFail.innerHTML = `<strong>Erro!</strong> ${error.message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        alertFail.style.display = 'block';
        
    } finally {
        spinner.style.display = 'none';
        submitButton.disabled = false;
    }
}