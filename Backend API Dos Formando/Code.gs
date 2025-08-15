// Ficheiro: Code.gs
// Ação: Adicione esta nova constante
// URL principal do seu dashboard de administração. Será usado no link do botão do e-mail.
const DASHBOARD_URL = 'https://tecdigitallda.github.io/Cursos/dashboard/index.html';


// ================================================================
// CONFIGURAÇÕES GLOBAIS - SITE PÚBLICO
// ================================================================
// 1. IDs ATUALIZADOS para corresponder ao sistema do dashboard
const SPREADSHEET_ID = '1uDI5JdGIlFgTjYjJINArq_m4Sq0_hiI96RyiiYG3qqc';
const DRIVE_FOLDER_ID = '1mMD1KsWYXPogYWkjdLUf3tuEORvDFySn';
const LOGO_FILE_ID = '1FcXHAviif6AScLa5OB-cYNwuO_3d18qe';

// 2. MAPEAMENTO EFICIENTE DE PASTAS para um desempenho mais rápido
const COURSE_FOLDER_IDS = {
  "Aplicação de Perucas": "1CFkgtiWtDM-BFSrZsEO86UNmUhGXYW1L",
  "Contabilidade Geral": "1Iwxgz485SQKavCKMbyVHUEAvFzRkF-jE",
  "Excel Avançado": "1VHUZHkq0xAuHRsWiT9x9KHKKahc2x-xw",
  "Gestão de Recursos Humanos": "1NRIKEGoj7MhaMyToyitEclHKsEqzgujI",
  "Importação": "19shPTVfzHpg45iG9tl3BRcxZzPO5lscB",
  "Maquiagem": "1nCQwpCGeJfGAtQD7g7ZFTpIDvvVapgN-",
  "Marketing Digital": "1APIf0QreU9rxZpmf80y4CONj_bF158cx",
  "Programação": "1QS6MrclnxaeCnLqt32jvzwQMnPHCZd8c",
  "Trader": "1V0awMRBUZWvDQ4nLDrhwp_R5tqwZ0H4L",
  "Outros": "1-DACtDh9b4EWe5duu1Z2K8MwOipVv2XM"
};

// ================================================================
// FUNÇÃO DE PESQUISA DE ALUNOS
// ================================================================
/**
 * Procura por um aluno em todas as abas de cursos usando o email e o BI.
 * @param {string} email O email do aluno a ser procurado.
 * @param {string} bi O número do BI do aluno a ser procurado.
 * @returns {object} Um objeto com os dados do aluno se encontrado, ou null.
 */
function searchForStudent(email, bi) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const allSheets = ss.getSheets();
  const excludedSheets = ["Finanças", "Funcionários", "Parceiros", "OutrosServicos", "Suporte", "HashesComprovativos"];

  for (const sheet of allSheets) {
    const sheetName = sheet.getName();
    if (excludedSheets.includes(sheetName) || sheet.getLastRow() < 2) {
      continue; // Pula para a próxima aba se for uma aba excluída ou vazia
    }

    const data = sheet.getDataRange().getValues();
    // Começa do segundo item (índice 1) para ignorar o cabeçalho
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // As colunas são baseadas em índice 0: D=3 (Email), F=5 (BI)
      const rowEmail = row[3];
      const rowBI = row[5];

      // Compara os valores (convertendo para string e removendo espaços para segurança)
      if (String(rowEmail).trim() === String(email).trim() && String(rowBI).trim() === String(bi).trim()) {
        // Aluno encontrado! Retorna os dados necessários.
        return {
          studentName: `${row[1]} ${row[2]}`, // Colunas B e C
          course: sheetName,
          status: row[8], // Coluna I
          finalGrade: row[9] || "Ainda não disponível" // Coluna J
        };
      }
    }
  }

  return null; // Retorna null se não encontrar o aluno em nenhuma aba
}

// ================================================================
// PONTO DE ENTRADA OBRIGATÓRIO PARA GET
// ================================================================
/**
 * O Google Apps Script exige esta função para qualquer Web App.
 * A nossa API só aceita pedidos POST, por isso esta função
 * retorna uma mensagem de erro informativa.
 */
// Substitua a sua função doGet antiga por esta
function doGet(e) {
  // Verifica se os parâmetros 'email' e 'bi' foram enviados no URL
  if (e.parameter.email && e.parameter.bi) {
    // Se sim, é um pedido de pesquisa
    try {
      const email = e.parameter.email;
      const bi = e.parameter.bi;
      const studentData = searchForStudent(email, bi);

      if (studentData) {
        // Aluno encontrado, retorna sucesso e os dados
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'success', data: studentData }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        // Aluno não encontrado
        throw new Error("Nenhum registo encontrado. Verifique se o e-mail e o Nº do Bilhete estão corretos.");
      }
    } catch (error) {
      // Em caso de erro na pesquisa
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else {
    // Se não houver parâmetros, é um acesso direto ao URL, retorna a mensagem padrão
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Este endpoint aceita apenas pedidos do tipo POST para inscrições.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ================================================================
// PONTO DE ENTRADA DO WEB APP (API PÚBLICA) (VERSÃO ATUALIZADA)
// ================================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { courseName, firstName, lastName, email, phoneNumber, biNumber, identityDocument, paymentProof } = data;

    if (!courseName || !firstName || !lastName || !identityDocument || !paymentProof) {
      throw new Error("Dados essenciais em falta. Por favor, preencha todos os campos obrigatórios.");
    }
    
    // ... (o código de verificação de hash continua aqui, sem alterações) ...
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hashSheet = ss.getSheetByName("HashesComprovativos");
    const proofBytes = Utilities.base64Decode(paymentProof.fileContent);
    const proofHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, proofBytes)
                      .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
                      .join('');

    const existingHashes = hashSheet.getRange(2, 2, hashSheet.getLastRow(), 1).getValues().flat();
    if (existingHashes.includes(proofHash)) {
      throw new Error("Este comprovativo de pagamento já foi submetido anteriormente. Por favor, anexe um comprovativo válido.");
    }
    
    // ... (o código de guardar na planilha e no Drive continua aqui, sem alterações) ...
    const sheet = ss.getSheetByName(courseName);
    if (!sheet) throw new Error(`Curso "${courseName}" não encontrado na base de dados.`);
    
    const courseFolderId = COURSE_FOLDER_IDS[courseName];
    if (!courseFolderId) throw new Error(`A pasta do curso "${courseName}" não foi encontrada no sistema.`);
    const courseFolder = DriveApp.getFolderById(courseFolderId);
    
    const studentFolderName = `${firstName}_${lastName}_${new Date().getTime()}`;
    const studentFolder = courseFolder.createFolder(studentFolderName);

    const proofBlob = Utilities.newBlob(proofBytes, paymentProof.mimeType, paymentProof.fileName);
    const biBlob = Utilities.newBlob(Utilities.base64Decode(identityDocument.fileContent), identityDocument.mimeType, identityDocument.fileName);
    const proofFile = studentFolder.createFile(proofBlob);
    const biFile = studentFolder.createFile(biBlob);

    sheet.appendRow([ new Date(), firstName, lastName, email, phoneNumber, biNumber, biFile.getUrl(), proofFile.getUrl(), "Pendente", "", "", "" ]);
    
    hashSheet.appendRow([new Date(), proofHash]);

    // ---> ALTERAÇÃO AQUI <---
    // Agora chamamos as duas funções do nosso EmailService
    EmailService.sendAdminNotification(data);
    EmailService.sendStudentConfirmation(data);
    // ---> FIM DA ALTERAÇÃO <---

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Pré-inscrição enviada com sucesso! Irá receber um e-mail de confirmação em breve.' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Inclua esta função para poder autorizar o script facilmente
function authorizeServices() {
    SpreadsheetApp.openById(SPREADSHEET_ID);
    DriveApp.getFolderById(DRIVE_FOLDER_ID);
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Teste de Autorização', 'Script autorizado.');
}

function testeContentService() {
  try {
    Logger.log("Iniciando o teste...");

    let output = ContentService.createTextOutput(JSON.stringify({ status: 'teste' }));
    Logger.log("Passo 1: createTextOutput - OK");

    output.setMimeType(ContentService.MimeType.JSON);
    Logger.log("Passo 2: setMimeType - OK");

    output.addHttpHeader('Access-Control-Allow-Origin', '*');
    Logger.log("Passo 3: addHttpHeader - OK");

    Logger.log("Teste concluído com sucesso!");
    return output;

  } catch (e) {
    Logger.log("O teste falhou: " + e.toString());
  }
}

// ================================================================
// SERVIÇO DE ENVIO DE E-MAIL (VERSÃO ATUALIZADA)
// ================================================================
const EmailService = {
  /**
   * Envia um e-mail de confirmação de pré-inscrição em formato HTML para o aluno.
   */
  sendStudentConfirmation: function(studentData) {
    if (!studentData.email) return;

    const logoBlob = DriveApp.getFileById(LOGO_FILE_ID).getBlob();
    const logoData = Utilities.base64Encode(logoBlob.getBytes());
    const logoUrl = `data:${logoBlob.getContentType()};base64,${logoData}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="${logoUrl}" alt="Logotipo TecDigital" style="max-width: 150px;">
          <h1 style="margin: 10px 0 0 0;">Pré-inscrição Recebida!</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #0d6efd;">Olá, ${studentData.firstName}!</h2>
          <p>Recebemos a sua pré-inscrição para o curso de <strong>${studentData.courseName}</strong> e estamos muito felizes por ter escolhido a TecDigital.</p>
          <p>A nossa equipa irá agora verificar os seus dados e o comprovativo de pagamento. Se estiver tudo correto, receberá um e-mail final de confirmação da sua matrícula em breve.</p>
          <p>Obrigado por dar o próximo passo na sua carreira connosco!</p>
          <p>Atenciosamente,<br><strong>A Equipa TecDigital</strong></p>
        </div>
        <div style="background-color: #f2f2f2; text-align: center; padding: 15px; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
          <p>&copy; ${new Date().getFullYear()} TecDigital Sul LDA. Todos os direitos reservados.</p>
          <p>Huambo, Angola</p>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: studentData.email,
      subject: `TecDigital | Confirmação de Pré-inscrição no Curso de ${studentData.courseName}`,
      htmlBody: htmlBody
    });
  },

  /**
   * NOVO: Envia um e-mail de notificação em HTML para o administrador.
   */
  sendAdminNotification: function(studentData) {
    const adminEmail = "tecdigital61@gmail.com";
    const dashboardApprovalLink = DASHBOARD_URL + '#/aprovacoes';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Nova Pré-inscrição</h1>
        </div>
        <div style="padding: 20px;">
          <p>Uma nova pré-inscrição foi submetida através do site público e aguarda a sua aprovação.</p>
          <h3 style="color: #0d6efd;">Detalhes do Formando:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Nome:</strong> ${studentData.firstName} ${studentData.lastName}</li>
            <li><strong>Curso:</strong> ${studentData.courseName}</li>
            <li><strong>Telefone:</strong> ${studentData.phoneNumber}</li>
            <li><strong>Email:</strong> ${studentData.email}</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardApprovalLink}" style="background-color: #0d6efd; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Ir para a Página de Aprovações
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">Os comprovativos de pagamento e BI estão disponíveis na página de aprovações do dashboard.</p>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: adminEmail,
      subject: `Nova Inscrição PENDENTE: ${studentData.firstName} ${studentData.lastName} - ${studentData.courseName}`,
      htmlBody: htmlBody
    });
  }
};