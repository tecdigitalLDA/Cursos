// ins-curso/inscricao.js

/**
 * Função auxiliar para ler um ficheiro e retornar os seus dados em formato Base64.
 */
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve({
                fileName: file.name,
                mimeType: file.type,
                fileContent: event.target.result.split(',')[1]
            });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Event Listener para a submissão do formulário de inscrição.
 */
document.getElementById('registrationForm').addEventListener('submit', async function(e) {
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
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbyzIvTYcak6l1feqF5V-ytMM9PRHn7-34H3BAMF1F_PtXe0sqPTQulfyzgq_qRvNWdteQ/exec'; // ****** IMPORTANTE: Insira a sua URL ******

        // NOVO: Pega o nome do curso a partir do parâmetro da URL do iframe
        const urlParams = new URLSearchParams(window.location.search);
        const courseName = urlParams.get('course') || 'Curso não especificado'; // Fallback

        const idFile = document.getElementById('identityDocument').files[0];
        const paymentFile = document.getElementById('paymentProof').files[0];

        if (!idFile || !paymentFile) {
            throw new Error("Por favor, anexe o Documento de Identidade e o Comprovativo de Pagamento.");
        }

        const [idFileData, paymentFileData] = await Promise.all([
            readFileAsBase64(idFile),
            readFileAsBase64(paymentFile)
        ]);

        // Monta o payload, agora incluindo o nome do curso
        const payload = {
             action: 'handleInscription', // <<< ADICIONE ESTA LINHA
            courseName: courseName, // <<< ADICIONADO
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            biNumber: document.getElementById('biNumber').value,
            email: document.getElementById('email').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            address: document.getElementById('address').value,
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

        const data = await response.json();

        if (data.status === 'success' && data.receiptUrl) {
            alertSuccess.style.display = 'block';
            const downloadLink = document.getElementById('download-receipt');
            downloadLink.href = data.receiptUrl;
            document.getElementById('registrationForm').reset();

            // Opcional: Envia uma mensagem para a página principal fechar o modal
            setTimeout(function() {
                window.parent.postMessage('closeModal', '*');
            }, 5000); // Fecha o modal após 5 segundos

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
});
// /**
//  * Função auxiliar para ler um ficheiro e retornar os seus dados em formato Base64.
//  */
// function readFileAsBase64(file) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = (event) => {
//             resolve({
//                 fileName: file.name,
//                 mimeType: file.type,
//                 fileContent: event.target.result.split(',')[1]
//             });
//         };
//         reader.onerror = (error) => reject(error);
//         reader.readAsDataURL(file);
//     });
// }

// /**
//  * Event Listener para a submissão do formulário de inscrição.
//  */
// document.getElementById('registrationForm').addEventListener('submit', async function(e) {
//     e.preventDefault();

//     const submitButton = document.getElementById('submitButton');
//     const spinner = document.getElementById('spinner');
//     const alertSuccess = document.getElementById('alert-sucesso');
//     const alertFail = document.getElementById('alert-falha');
    
//     alertSuccess.style.display = 'none';
//     alertFail.style.display = 'none';
//     spinner.style.display = 'inline-block';
//     submitButton.disabled = true;

//     try {
//         // ****** IMPORTANTE: Insira aqui a URL da sua NOVA implementação! ******
//         const webAppUrl = 'https://script.google.com/macros/s/AKfycbyzIvTYcak6l1feqF5V-ytMM9PRHn7-34H3BAMF1F_PtXe0sqPTQulfyzgq_qRvNWdteQ/exec';

//         const idFile = document.getElementById('identityDocument').files[0];
//         const paymentFile = document.getElementById('paymentProof').files[0];

//         if (!idFile || !paymentFile) {
//             throw new Error("Por favor, anexe o Documento de Identidade e o Comprovativo de Pagamento.");
//         }

//         const [idFileData, paymentFileData] = await Promise.all([
//             readFileAsBase64(idFile),
//             readFileAsBase64(paymentFile)
//         ]);

//         const payload = {
//             firstName: document.getElementById('firstName').value,
//             lastName: document.getElementById('lastName').value,
//             biNumber: document.getElementById('biNumber').value,
//             email: document.getElementById('email').value,
//             phoneNumber: document.getElementById('phoneNumber').value,
//             address: document.getElementById('address').value,
//             province: document.getElementById('province').value,
//             municipality: document.getElementById('municipality').value,
//             identityDocument: idFileData,
//             paymentProof: paymentFileData
//         };
        
//         const response = await fetch(webAppUrl, {
//             method: 'POST',
//             body: JSON.stringify(payload),
//             headers: { 'Content-Type': 'text/plain;charset=utf-8' }
//         });

//         const data = await response.json();

//         if (data.status === 'success' && data.receiptUrl) {
//             alertSuccess.style.display = 'block';
//             const downloadLink = document.getElementById('download-receipt');
//             downloadLink.href = data.receiptUrl;
//             document.getElementById('registrationForm').reset();
//         } else {
//             throw new Error(data.message || "Ocorreu um erro desconhecido no servidor.");
//         }

//     } catch (error) {
//         console.error('Erro no processo de inscrição:', error);
//         alertFail.innerHTML = `<strong>Erro!</strong> ${error.message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
//         alertFail.style.display = 'block';
        
//     } finally {
//         spinner.style.display = 'none';
//         submitButton.disabled = false;
//     }
// });
