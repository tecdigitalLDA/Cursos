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
// Ação: Substitua a função handleFormSubmit
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
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbxyHnW6rIT1lJ9dPBqnvKYZQ3KZ0IHZV_e_3g4dtgI98cyu8X7cbxrlOozF3o1srf8fyg/exec';
        const urlParams = new URLSearchParams(window.location.search);
        const courseName = urlParams.get('course') || 'Curso não especificado';
        const idFile = document.getElementById('identityDocument').files[0];
        const paymentFile = document.getElementById('paymentProof').files[0];
        const [idFileData, paymentFileData] = await Promise.all([
            readFileAsBase64(idFile),
            readFileAsBase64(paymentFile)
        ]);

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
        
        const finalPayload = {
            action: 'handlePublicInscription',
            payload: studentPayload
        };

        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: JSON.stringify(finalPayload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        
        if (!response.ok) {
            throw new Error(`O servidor respondeu com um erro: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.status === 'success') {
            alertSuccess.innerHTML = `<strong>Sucesso!</strong> ${result.message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
            alertSuccess.style.display = 'block';
            document.getElementById('registrationForm').reset();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alertFail.innerHTML = `<strong>Erro!</strong> ${error.message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        alertFail.style.display = 'block';
    } finally {
        spinner.style.display = 'none';
        submitButton.disabled = false;
    }
}