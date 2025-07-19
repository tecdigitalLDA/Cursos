// C:\Users\mults\Desktop\Site Tecdigital\ins-curso\inscricao-curso.js

// 1. Lista de Cursos (Exemplo, você pode expandir com mais detalhes se necessário)
const listaCursos = [
    { id: 'excel-avancado', nome: 'Excel Avançado' },
    { id: 'importacao', nome: 'Importação' },
    { id: 'contabilidade-geral', nome: 'Contabilidade Geral' },
    { id: 'gestao-recursos-humanos', nome: 'Gestão de Recursos Humanos' },
    { id: 'marketing-digital', nome: 'Marketing Digital' },
    { id: 'trader', nome: 'Trader' },
    { id: 'programacao', nome: 'Programação' },
    { id: 'maquiagem', nome: 'Maquiagem' },
    { id: 'aplicacao-pirucas', nome: 'Aplicação de Perucas' },
    { id: 'inscricao-geral', nome: 'Inscrição Geral' } // Para o botão genérico
];

document.addEventListener('DOMContentLoaded', function() {
    // Função para obter parâmetros da URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // 2. Alteração Dinâmica do Título do Modal
    const courseNameFromUrl = getUrlParameter('course');
    const modalTitleElement = document.getElementById('modalTitle'); // Supondo que você terá um elemento com id 'modalTitle' no seu modal.html
    const courseInput = document.getElementById('cursoInscricao'); // Input escondido para o nome do curso

    if (modalTitleElement && courseNameFromUrl) {
        modalTitleElement.textContent = `Inscrição para o Curso de ${courseNameFromUrl}`;
    }
    if (courseInput && courseNameFromUrl) {
        courseInput.value = courseNameFromUrl; // Preenche o campo de curso no formulário
    }

    // 3. Validação da Ficha de Inscrição
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Previne o envio padrão do formulário

            let isValid = true;
            const formFields = registrationForm.querySelectorAll('[required]');

            formFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'red'; // Indica erro visualmente
                } else {
                    field.style.borderColor = ''; // Limpa a indicação de erro
                }
            });

            const emailField = document.getElementById('email');
            if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
                isValid = false;
                emailField.style.borderColor = 'red';
                alert('Por favor, insira um email válido.');
            } else if (emailField) {
                emailField.style.borderColor = '';
            }

            const phoneField = document.getElementById('telefone');
            if (phoneField && !/^\d{9}$/.test(phoneField.value)) { // Exemplo para 9 dígitos
                isValid = false;
                phoneField.style.borderColor = 'red';
                alert('Por favor, insira um número de telefone válido (9 dígitos).');
            } else if (phoneField) {
                phoneField.style.borderColor = '';
            }

            // Validação de uploads de arquivo (exemplo básico)
            const bilheteFile = document.getElementById('bilheteFile');
            const comprovativoFile = document.getElementById('comprovativoFile');

            if (bilheteFile && bilheteFile.files.length === 0) {
                isValid = false;
                alert('Por favor, anexe o ficheiro do Bilhete de Identidade.');
            }
            if (comprovativoFile && comprovativoFile.files.length === 0) {
                isValid = false;
                alert('Por favor, anexe o comprovativo de pagamento.');
            }


            if (isValid) {
                alert('Formulário validado com sucesso! Gerando recibo e fazendo upload...');
                
                // Coleta dos dados do formulário
                const formData = new FormData(registrationForm);
                const data = {};
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }

                // 4. Geração do PDF (Recibo)
                await generateAndDownloadReceipt(data);

                // 5. Conexão com Google Apps Script para Upload
                // É necessário enviar os arquivos e os dados do formulário para o Apps Script
                // A função `uploadToGoogleAppsScript` será definida abaixo
                const uploadSuccess = await uploadToGoogleAppsScript(formData);

                if (uploadSuccess) {
                    alert('Inscrição realizada com sucesso e arquivos enviados!');
                    registrationForm.reset(); // Limpa o formulário
                    // Opcional: Fechar o modal após o sucesso
                    // window.parent.postMessage('closeModal', '*'); // Envia mensagem para a página pai fechar o modal
                } else {
                    alert('Ocorreu um erro ao enviar os arquivos. Por favor, tente novamente.');
                }

            } else {
                alert('Por favor, preencha todos os campos obrigatórios corretamente.');
            }
        });
    }

    // Função para gerar e baixar o recibo em PDF
    async function generateAndDownloadReceipt(data) {
        // Certifique-se de que a biblioteca jsPDF está carregada.
        // Você pode incluir ela no seu modal.html via CDN:
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF library not loaded. Please include it in your modal.html.');
            alert('Erro: Biblioteca jsPDF não carregada. O recibo não pode ser gerado.');
            return;
        }

        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("Recibo de Inscrição TecDigital LDA", 105, 20, null, null, "center");

        doc.setFontSize(12);
        let y = 40;
        const lineHeight = 10;

        doc.text(`Data de Inscrição: ${new Date().toLocaleDateString()}`, 10, y);
        y += lineHeight;
        doc.text(`Curso: ${data.cursoInscricao || 'Não especificado'}`, 10, y);
        y += lineHeight;
        doc.text(`Nome Completo: ${data.nomeCompleto || ''}`, 10, y);
        y += lineHeight;
        doc.text(`Data de Nascimento: ${data.dataNascimento || ''}`, 10, y);
        y += lineHeight;
        doc.text(`Nº BI: ${data.numeroBI || ''}`, 10, y);
        y += lineHeight;
        doc.text(`Morada: ${data.morada || ''}`, 10, y);
        y += lineHeight;
        doc.text(`Telefone: ${data.telefone || ''}`, 10, y);
        y += lineHeight;
        doc.text(`Email: ${data.email || ''}`, 10, y);
        y += lineHeight;
        doc.text(`Profissão: ${data.profissao || ''}`, 10, y);
        y += lineHeight;
        doc.text(`Nível Acadêmico: ${data.nivelAcademico || ''}`, 10, y);
        y += lineHeight * 2;
        doc.text("Termos e Condições:", 10, y);
        y += lineHeight;
        doc.text("Ao se inscrever, o formando concorda com os termos de matrícula da TecDigital LDA.", 10, y);
        y += lineHeight;
        doc.text("O comprovativo de pagamento foi recebido e a inscrição será confirmada após verificação.", 10, y);

        doc.setFontSize(10);
        y = doc.internal.pageSize.height - 20; // Posiciona no final da página
        doc.text("TecDigital LDA - Contacto: (+244) 936 065 155 - Email: tecdigital61@gmail.com", 10, y);

        // Salvar o PDF
        const pdfFileName = `Recibo_Inscricao_${data.nomeCompleto.replace(/\s/g, '_')}_${data.cursoInscricao.replace(/\s/g, '_')}.pdf`;
        doc.save(pdfFileName);

        // Opcional: Se quiser enviar o PDF para o Google Apps Script diretamente
        // const pdfBlob = doc.output('blob'); // Obter o PDF como Blob
        // formData.append('reciboPDF', pdfBlob, pdfFileName); // Adicionar ao FormData para upload
    }

    // 5. Conexão com Google Apps Script para Upload
    async function uploadToGoogleAppsScript(formData) {
        // Substitua 'YOUR_APPS_SCRIPT_WEB_APP_URL' pela URL de implantação do seu script da web do Google Apps Script
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbwcYhsdVBQU_VrHKcpk3vs1p8bqPsWjyMhQdLzRApOSuQeoUdu4egBgZWJ1Xcad4OJvGg/exec';

        try {
            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: formData // FormData contém todos os campos do formulário e arquivos
            });

            const result = await response.json();
            if (result.status === 'success') {
                console.log('Upload successful:', result.message);
                return true;
            } else {
                console.error('Upload failed:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error during upload to Google Apps Script:', error);
            return false;
        }
    }

    // Listener para fechar o modal quando a mensagem for recebida do iframe
    window.addEventListener('message', function(event) {
        if (event.data === 'closeModal') {
            const modal = window.parent.document.getElementById('inscriptionModal');
            if (modal) {
                modal.style.display = 'none';
                const modalIframe = window.parent.document.getElementById('modalIframe');
                if (modalIframe) {
                    modalIframe.src = ""; // Limpa o src do iframe
                }
            }
        }
    });

});