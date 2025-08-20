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



/**
 * Busca todas as salas online com o status "Ativa" da planilha.
 * @returns {Array} Uma lista de objetos, cada um representando uma sala ativa.
 */
function getActiveOnlineClasses() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("SalasOnline");
  if (sheet.getLastRow() < 2) return []; // Retorna vazio se não houver salas

  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const activeClasses = [];

  allData.forEach(row => {
    const status = row[5]; // Coluna F (Status)
    if (status && String(status).trim().toUpperCase() === "ATIVA") {
      activeClasses.push({
        id: row[0],       // Coluna A (ID_Sala)
        name: row[1],     // Coluna B (Nome_da_Sala)
        course: row[2]  // Coluna C (Curso_Associado)
      });
    }
  });
  
  return activeClasses;
}


/**
 * Lida com uma nova inscrição numa turma online feita através do Login com Google.
 * @param {object} registrationData Dados da inscrição, incluindo ID da sala e info do aluno.
 * @returns {string} Uma mensagem de sucesso.
 */
function handleOnlineRegistration(registrationData) {
  const { classId, studentInfo } = registrationData;
  if (!classId || !studentInfo || !studentInfo.email) {
    throw new Error("Informação insuficiente para completar o registo.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("InscricoesOnline");

  // Verifica se o aluno já está inscrito nesta turma
  const data = sheet.getDataRange().getValues();
  const isAlreadyEnrolled = data.some(row => row[1] === classId && row[2] === studentInfo.email);
  if (isAlreadyEnrolled) {
    throw new Error("Você já está inscrito nesta turma.");
  }

  // Regista o novo aluno
  const inscriptionId = `INSC-ONLINE-${new Date().getTime()}`;
  sheet.appendRow([
    inscriptionId,
    classId,
    studentInfo.email,
    studentInfo.name,
    new Date(),
    "Ativo"
  ]);

  // Envia e-mails de notificação
  const classSheet = ss.getSheetByName("SalasOnline");
  const classData = classSheet.getDataRange().getValues();
  const classRow = classData.find(row => row[0] === classId);
  const className = classRow ? classRow[1] : "Nome da Turma Indisponível";

  const emailData = {
    email: studentInfo.email,
    firstName: studentInfo.given_name || studentInfo.name,
    courseName: className
  };
  
  EmailService.sendStudentConfirmation(emailData);
  EmailService.sendAdminNotification({ ...emailData, phoneNumber: 'N/A', lastName: studentInfo.family_name || '' });

  return "Inscrição online realizada com sucesso!";
}

// ================================================================
// PONTO DE ENTRADA OBRIGATÓRIO PARA GET
// ================================================================
function doGet(e) {
  try {
    const action = e.parameter.action;

    // Roteador de Ações para pedidos GET
    if (action === 'getOnlineClasses') {
      // Se a ação for para obter as turmas online
      const classes = getActiveOnlineClasses();
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: classes }))
        .setMimeType(ContentService.MimeType.JSON);

    } else if (e.parameter.email && e.parameter.bi) {
      // Se for uma pesquisa de aluno (a funcionalidade existente)
      const studentData = searchForStudent(e.parameter.email, e.parameter.bi);
      if (studentData) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'success', data: studentData }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Nenhum registo encontrado. Verifique se o e-mail e o Nº do Bilhete estão corretos.");
      }
    } else {
      // Se for um acesso direto ao URL, retorna a mensagem padrão
      throw new Error("Endpoint não especificado.");
    }

  } catch (error) {
    // Em caso de qualquer erro
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ================================================================
// PONTO DE ENTRADA DO WEB APP (API PÚBLICA) (VERSÃO FINAL COM ROUTER)
// ================================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Este switch funciona como um "router", direcionando para a função correta
    // com base na 'action' enviada pelo frontend.
    switch (data.action) {
      
      // Caso para a nova inscrição online com Login Google
      case 'registerOnlineStudent':
        const message = handleOnlineRegistration(data.payload);
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'success', message: message }))
          .setMimeType(ContentService.MimeType.JSON);

      // Caso para a inscrição do formulário público antigo
      case 'handlePublicInscription':
        const { courseName, firstName, lastName, email, phoneNumber, biNumber, identityDocument, paymentProof } = data.payload;

        if (!courseName || !firstName || !lastName || !identityDocument || !paymentProof) {
          throw new Error("Dados essenciais em falta.");
        }
        
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const hashSheet = ss.getSheetByName("HashesComprovativos");
        const proofBytes = Utilities.base64Decode(paymentProof.fileContent);
        const proofHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, proofBytes)
                          .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
                          .join('');

        const existingHashes = hashSheet.getRange(2, 2, hashSheet.getLastRow(), 1).getValues().flat();
        if (existingHashes.includes(proofHash)) {
          throw new Error("Este comprovativo de pagamento já foi submetido anteriormente.");
        }
        
        const sheet = ss.getSheetByName(courseName);
        if (!sheet) throw new Error(`Curso "${courseName}" não encontrado.`);
        
        const courseFolderId = COURSE_FOLDER_IDS[courseName];
        if (!courseFolderId) throw new Error(`A pasta do curso "${courseName}" não foi encontrada.`);
        const courseFolder = DriveApp.getFolderById(courseFolderId);
        
        const studentFolderName = `${firstName}_${lastName}_${new Date().getTime()}`;
        const studentFolder = courseFolder.createFolder(studentFolderName);

        const proofBlob = Utilities.newBlob(proofBytes, paymentProof.mimeType, paymentProof.fileName);
        const biBlob = Utilities.newBlob(Utilities.base64Decode(identityDocument.fileContent), identityDocument.mimeType, identityDocument.fileName);
        const proofFile = studentFolder.createFile(proofBlob);
        const biFile = studentFolder.createFile(biBlob);

        sheet.appendRow([ new Date(), firstName, lastName, email, phoneNumber, biNumber, biFile.getUrl(), proofFile.getUrl(), "Pendente", "", "", "" ]);
        hashSheet.appendRow([new Date(), proofHash]);

        // Note que o payload para os emails é data.payload
        EmailService.sendAdminNotification(data.payload);
        EmailService.sendStudentConfirmation(data.payload);

        return ContentService
          .createTextOutput(JSON.stringify({ status: 'success', message: 'Pré-inscrição enviada com sucesso!' }))
          .setMimeType(ContentService.MameType.JSON);

      default:
        throw new Error("Ação não reconhecida.");
    }

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