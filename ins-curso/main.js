document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const registrationFormTitle = document.getElementById('registration-form-title');
    const spinnerSucesso = document.getElementById('spinner-sucesso');
    const spinnerFalha = document.getElementById('spinner-falha');
    const downloadReceiptLink = document.getElementById('download-receipt');

    // Esconde os alertas inicialmente
    spinnerSucesso.classList.remove('show');
    spinnerFalha.classList.remove('show');

    // Função para atualizar o título do modal dinamicamente
    // Esta função será chamada a partir do botão que abre o modal
    function updateModalTitle(courseName) {
        registrationFormTitle.textContent = `Ficha de inscrição para o curso de ${courseName}`;
    }

    // Exemplo de como você chamaria a função para atualizar o título
    // Você precisaria ter um botão na sua página principal que chama o modal
    // e passa o nome do curso como um atributo de dados (data-course-name)
    const courseButtons = document.querySelectorAll('[data-bs-toggle="modal"][data-bs-target="#modalSheet"]');
    courseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseName = this.dataset.courseName;
            if (courseName) {
                updateModalTitle(courseName);
            }
            // Esconde os alertas quando o modal é aberto novamente
            spinnerSucesso.classList.remove('show');
            spinnerFalha.classList.remove('show');
        });
    });

    // Lida com o envio do formulário
    registrationForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário
        event.stopPropagation(); // Impede a propagação do evento

        // Remove quaisquer classes de validação anteriores
        registrationForm.classList.remove('was-validated');

        // Validação dos campos do formulário
        if (!registrationForm.checkValidity()) {
            registrationForm.classList.add('was-validated');
            spinnerFalha.textContent = "Erro! Por favor, preencha todos os campos obrigatórios corretamente.";
            spinnerFalha.classList.add('show'); // Exibe o alerta de falha
            return; // Interrompe a execução se a validação falhar
        }

        // Simula o envio de dados e o status (sucesso/falha)
        // Em um cenário real, você enviaria os dados para o Google Apps Script aqui
        const formData = new FormData(registrationForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Simulação de sucesso/falha
        const simulationSuccess = Math.random() < 0.8; // 80% de chance de sucesso para fins de teste

        // Oculta todos os alertas antes de exibir o resultado
        spinnerSucesso.classList.remove('show');
        spinnerFalha.classList.remove('show');

        if (simulationSuccess) {
            spinnerSucesso.classList.add('show'); // Exibe o alerta de sucesso
            // Em um cenário real, aqui você chamaria a função Apps Script para:
            // 1. Enviar os dados do formulário e arquivos para o Google Drive
            // 2. Gerar o PDF (usando o Apps Script)
            // 3. Enviar e-mails com o recibo e detalhes para tecdigital@gmail.com e chimuco.geral@gmail.com
            // 4. Fornecer um link para download do PDF (que pode ser gerado pelo Apps Script e retornado)

            // Exemplo de como você geraria o PDF e iniciaria o download (apenas um placeholder)
            // Em um cenário real, 'generateAndDownloadPdf' seria uma função do Apps Script
            // que retorna um URL de download temporário ou o blob do PDF.
            console.log('Dados do formulário para envio (simulado):', data);
            console.log('Arquivos para upload (simulado):', document.getElementById('identityDocument').files[0], document.getElementById('paymentProof').files[0]);

            // Define o link de download (seria preenchido com o URL real do PDF)
            downloadReceiptLink.href = "#"; // Substituir pelo URL do PDF gerado
            downloadReceiptLink.onclick = function() {
                alert('O download do recibo será iniciado em breve (funcionalidade Apps Script).');
                // Chamar função Apps Script para download real
                // google.script.run.withSuccessHandler(handleDownload).generateReceiptPdf(data);
            };

            // Limpa o formulário após o sucesso
            registrationForm.reset();
            registrationForm.classList.remove('was-validated');

        } else {
            spinnerFalha.classList.add('show'); // Exibe o alerta de falha
            spinnerFalha.textContent = "Erro! Não foi possível concluir sua inscrição. Por favor, tente novamente.";
        }
    });

    // Preenchimento dinâmico de municípios
    const provinces = {
        "Huambo": ["Huambo", "Caála", "Longonjo"],
        "Luanda": ["Luanda", "Viana", "Cacuaco", "Belas"],
        "Benguela": ["Benguela", "Lobito", "Catumbela"],
        // Adicione mais províncias e seus municípios
    };

    const provinceSelect = document.getElementById('province');
    const municipalitySelect = document.getElementById('municipality');

    provinceSelect.addEventListener('change', function() {
        const selectedProvince = this.value;
        municipalitySelect.innerHTML = '<option value="">Selecione...</option>'; // Limpa as opções existentes

        if (selectedProvince && provinces[selectedProvince]) {
            provinces[selectedProvince].forEach(municipality => {
                const option = document.createElement('option');
                option.value = municipality;
                option.textContent = municipality;
                municipalitySelect.appendChild(option);
            });
        }
    });
});

// Funções de integração com Google Apps Script (necessitarão ser implementadas no GAS)
// Exemplo de como você chamaria uma função Apps Script para processar o formulário
/*
function handleFormSubmit(formObject) {
    google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onFailure).processRegistration(formObject);
}

function onSuccess(response) {
    if (response.status === "success") {
        document.getElementById('spinner-sucesso').classList.add('show');
        document.getElementById('download-receipt').href = response.pdfUrl; // URL do PDF gerado
        document.getElementById('registrationForm').reset();
        document.getElementById('registrationForm').classList.remove('was-validated');
    } else {
        document.getElementById('spinner-falha').textContent = response.message || "Erro desconhecido.";
        document.getElementById('spinner-falha').classList.add('show');
    }
}

function onFailure(error) {
    document.getElementById('spinner-falha').textContent = "Erro de comunicação com o servidor: " + error.message;
    document.getElementById('spinner-falha').classList.add('show');
}
*/