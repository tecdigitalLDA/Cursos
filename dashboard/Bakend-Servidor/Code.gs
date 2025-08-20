// ================================================================
// CONFIGURAÇÕES GLOBAIS
// ================================================================
// IDs que o sistema utiliza para se conectar à sua base de dados.
const SPREADSHEET_ID = '1uDI5JdGIlFgTjYjJINArq_m4Sq0_hiI96RyiiYG3qqc';
const DRIVE_FOLDER_ID = '1mMD1KsWYXPogYWkjdLUf3tuEORvDFySn';
const LOGO_FILE_ID = '1FcXHAviif6AScLa5OB-cYNwuO_3d18qe';

// ================================================================
// MAPEAMENTO DOS IDs DAS PASTAS DE CURSOS NO GOOGLE DRIVE
// ================================================================
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
// PONTO DE ENTRADA PRINCIPAL (SERVIDOR WEB)
// ================================================================
/**
 * Função principal que serve o HTML da aplicação.
 * É executada quando o administrador acede à URL da aplicação web.
 */
function doGet(e) {
  // O nome 'index.html' deve corresponder ao ficheiro principal do seu dashboard.
  return HtmlService.createHtmlOutputFromFile('index.html')
    .setTitle('Dashboard de Administração - TecDigital')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ================================================================
// PONTO DE ENTRADA PARA REQUISIÇÕES POST (API)
// ================================================================
/**
 * Lida com as requisições POST vindas do frontend.
 * Esta função funciona como um router para a nossa API.
 */
function doPost(e) {
  let response;
  try {
    const requestData = JSON.parse(e.postData.contents);

    if (!requestData || !requestData.action) {
      throw new Error("A requisição é inválida ou não contém uma 'action'.");
    }

    switch (requestData.action) {
      case 'getPending':
        response = { status: 'success', data: InscriptionService.getPending() };
        break;
      case 'approve':
        const approvalMessage = InscriptionService.approve(requestData.payload);
        response = { status: 'success', message: approvalMessage };
        break;
      case 'manuallyRegisterStudent':
        const registerMessage = StudentService.manualRegister(requestData.payload);
        response = { status: 'success', message: registerMessage };
        break;
      
      // ---> NOVAS AÇÕES ADICIONADAS AQUI <---
      case 'getEnrolledStudents':
        response = { status: 'success', data: StudentService.getEnrolled() };
        break;
      case 'updateGrade':
        const updateMessage = StudentService.updateGradeAndStatus(requestData.payload);
        response = { status: 'success', message: updateMessage };
        break;
      // ---> FIM DAS NOVAS AÇÕES <---

      // ---> ADICIONE ESTE NOVO CASE AQUI <---
      case 'getFinancialData':
        response = { status: 'success', data: FinanceService.getFinancialData(requestData.payload.filter) };
        break;
      // ---> FIM DA NOVA AÇÃO <---

      // ---> NOVAS AÇÕES ADICIONADAS AQUI <---
      case 'getOnlineClasses':
        response = { status: 'success', data: OnlineClassService.getAll() };
        break;
      case 'createOnlineClass':
        const createClassMsg = OnlineClassService.create(requestData.payload);
        response = { status: 'success', message: createClassMsg };
        break;
      case 'deleteOnlineClass':
        const deleteClassMsg = OnlineClassService.delete(requestData.payload.classId);
        response = { status: 'success', message: deleteClassMsg };
        break;
      // ---> FIM DAS NOVAS AÇÕES <--

      default:
        throw new Error(`A ação "${requestData.action}" não é reconhecida.`);
    }
  } catch (error) {
    Logger.log(error.toString());
    response = { status: 'error', message: error.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// FUNÇÕES GLOBAIS (Expostas para o google.script.run)
// ================================================================
function getPendingInscriptions() {
  return InscriptionService.getPending();
}

function approveInscription(data) {
  return InscriptionService.approve(data);
}

// ================================================================
// FUNÇÕES EXPOSTAS PARA O FRONTEND (API)
// ================================================================
// Estas são as únicas funções que o JavaScript do seu dashboard pode chamar
// diretamente através de `google.script.run`. Elas servem como uma ponte
// para os serviços mais complexos abaixo.


function getStudentDetails(course, rowNumber) { return StudentService.getDetails(course, rowNumber); }
function updateStudentDetails(data) { return StudentService.update(data); }
function manuallyRegisterStudent(data) { return StudentService.manualRegister(data); }
function getFinancialOverview() { return FinanceService.getOverview(); }
function getEmployees() { return TeamService.getEmployees(); }
function addEmployee(data) { return TeamService.addEmployee(data); }
function getPartners() { return TeamService.getPartners(); }
function addPartner(data) { return TeamService.addPartner(data); }


// ================================================================
// SERVIÇO DE GESTÃO DE ALUNOS (CADASTRO, EDIÇÃO, ATUALIZAÇÃO)
// ================================================================
const StudentService = {
  /**
   * Agenda um registo manual para ser processado em segundo plano.
   */
  manualRegister: function(studentData) {
    // ... (esta função continua igual)
    const now = new Date();
    const courseSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(studentData.course);
    if (!courseSheet) {
        throw new Error(`A aba para o curso "${studentData.course}" não foi encontrada.`);
    }
    const financialData = { amount: studentData.amount, paymentMethod: studentData.paymentMethod };
    const filePayload = studentData.biDocument ? JSON.stringify(studentData.biDocument) : "";
    courseSheet.appendRow([ now, studentData.firstName, studentData.lastName, studentData.email, studentData.phone, studentData.bi, "", "", "Processando", "", JSON.stringify(financialData), filePayload ]);
    return "Inscrição recebida! O registo está a ser processado em segundo plano e estará completo em alguns minutos.";
  },
  /**
   * NOVO: Busca todos os alunos com status "Inscrito" de todas as abas de cursos.
   */
  getEnrolled: function() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const allSheets = ss.getSheets();
    const enrolledStudents = [];
    const excludedSheets = ["Finanças", "Funcionários", "Parceiros", "OutrosServicos", "Suporte", "HashesComprovativos"];

    allSheets.forEach(sheet => {
      const sheetName = sheet.getName();
      if (excludedSheets.includes(sheetName) || sheet.getLastRow() < 2) return;

      const data = sheet.getDataRange().getValues();
      data.forEach((row, index) => {
        if (index === 0) return; // Ignora o cabeçalho
        
        const status = row[8]; // Coluna I
        if (status && String(status).trim().toUpperCase() === "INSCRITO") {
          enrolledStudents.push({
            rowNumber: index + 1,
            sheetName: sheetName,
            firstName: row[1],
            lastName: row[2],
            email: row[3],
            phone: row[4],
            course: sheetName,
            finalGrade: row[9] || '' // Coluna J
          });
        }
      });
    });
    return enrolledStudents;
  },

  /**
   * NOVO: Atualiza a classificação final e o status de um aluno para "Concluido".
   */
  updateGradeAndStatus: function(updateData) {
    const { sheetName, rowNumber, finalGrade } = updateData;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
    
    // Atualiza a Coluna J (Classificação Final) e a Coluna I (Status)
    sheet.getRange(rowNumber, 9, 1, 2).setValues([["Concluido", finalGrade]]);
    
    return `O status e a classificação de ${sheetName} (linha ${rowNumber}) foram atualizados.`;
  }
};


// ================================================================
// SERVIÇO DE GESTÃO DE INSCRIÇÕES (APROVAÇÕES)
// ================================================================
const InscriptionService = {
  /**
   * Procura por todas as inscrições com status "Pendente" em todas as abas de cursos.
   */
  getPending: function() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const allSheets = ss.getSheets();
    const pendingInscriptions = [];
    const excludedSheets = ["Finanças", "Funcionários", "Parceiros", "OutrosServicos", "Suporte", "HashesComprovativos"];

    allSheets.forEach(sheet => {
      const sheetName = sheet.getName();
      if (excludedSheets.includes(sheetName) || sheet.getLastRow() < 2) return;

      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
      
      data.forEach((row, index) => {
        const status = row[8];
        // Comparação insensível a maiúsculas/minúsculas
        if (status && String(status).trim().toUpperCase() === "PENDENTE") {
          pendingInscriptions.push({
            rowNumber: index + 2,
            sheetName: sheetName,
            timestamp: row[0],
            firstName: row[1],
            lastName: row[2],
            proofLink: row[7]
          });
        }
      });
    });
    return pendingInscriptions;
  },

  /**
   * Aprova uma inscrição: muda o status, regista a transação e envia e-mail de confirmação.
   */
  approve: function(approvalData) {
    const { sheetName, rowNumber, amount, paymentMethod } = approvalData;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    
    sheet.getRange(rowNumber, 9).setValue("Inscrito");

    const financeSheet = ss.getSheetByName('Finanças');
    const studentInfo = sheet.getRange(rowNumber, 1, 1, 4).getValues()[0];
    const studentData = {
      courseName: sheetName,
      firstName: studentInfo[1],
      lastName: studentInfo[2],
      email: studentInfo[3]
    };
    const transactionId = "TRANS-" + new Date().getTime();
    financeSheet.appendRow([
      transactionId, new Date(), "Entrada", `Matrícula - ${studentData.firstName} ${studentData.lastName}`,
      amount, paymentMethod, "", sheetName, "Pago"
    ]);
    
    EmailService.sendApprovalConfirmation(studentData);
    
    return "Inscrição aprovada com sucesso! O aluno foi notificado por e-mail.";
  }
};

// ================================================================
// SERVIÇO FINANCEIRO (VERSÃO MELHORADA COM FILTROS)
// ================================================================
const FinanceService = {
  /**
   * Busca os dados financeiros com base num filtro de período (dia, semana, mês, tudo).
   */
  getFinancialData: function(filter = 'all') {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const financeSheet = ss.getSheetByName('Finanças');
    if (financeSheet.getLastRow() < 2) {
      return { summary: { totalEntradas: 0, totalSaidas: 0, saldo: 0 }, transactions: [] };
    }

    const allData = financeSheet.getRange(2, 1, financeSheet.getLastRow() - 1, financeSheet.getLastColumn()).getValues();
    
    // Define a data de início para o filtro
    const now = new Date();
    let startDate;
    if (filter === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (filter === 'this_week') {
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let totalEntradas = 0;
    let totalSaidas = 0;
    const transactions = [];

    allData.forEach(row => {
      const transactionDate = new Date(row[1]); // Coluna B (Data)
      
      // Se a data da transação for posterior à data de início do filtro, processa-a
      if (!startDate || transactionDate >= startDate) {
        const type = row[2]; // Coluna C (Tipo)
        const amount = parseFloat(row[4]) || 0; // Coluna E (Montante)

        if (type === 'Entrada') {
          totalEntradas += amount;
        } else if (type === 'Saída') {
          totalSaidas += amount;
        }
        
        // Adiciona a transação formatada à lista para o frontend
        transactions.push({
          id: row[0],
          date: transactionDate.toLocaleDateString(),
          type: type,
          description: row[3],
          amount: amount.toFixed(2) + ' Kz'
        });
      }
    });

    return {
      summary: {
        totalEntradas: totalEntradas,
        totalSaidas: totalSaidas,
        saldo: totalEntradas - totalSaidas
      },
      transactions: transactions.reverse() // Mostra as mais recentes primeiro
    };
  }
};


// ================================================================
// SERVIÇO DE GESTÃO DE SALAS ONLINE
// ================================================================
const OnlineClassService = {
  /**
   * Cria uma nova sala online, incluindo a pasta no Google Drive.
   */
  create: function(classData) {
    const { className, courseName } = classData;
    if (!className || !courseName) {
      throw new Error("O nome da sala e o curso associado são obrigatórios.");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const onlineClassesSheet = ss.getSheetByName("SalasOnline");

    // 1. Cria a pasta da sala no Google Drive
    const parentFolder = DriveApp.getFolderById('1mMD1KsWYXPogYWkjdLUf3tuEORvDFySn').getFoldersByName("Salas de Aula Online").next();
    const newFolder = parentFolder.createFolder(className);
    const newFolderId = newFolder.getId();

    // 2. Gera um ID único para a sala e regista na planilha
    const classId = `SALA-${new Date().getTime()}`;
    onlineClassesSheet.appendRow([
      classId,
      className,
      courseName,
      newFolderId,
      Session.getEffectiveUser().getEmail(), // Associa o formador/admin que a criou
      "Ativa",
      new Date()
    ]);

    return `Sala "${className}" criada com sucesso!`;
  },

  /**
   * Lista todas as salas online criadas.
   */
  getAll: function() {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("SalasOnline");
    if (sheet.getLastRow() < 2) return [];

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
    // Converte os dados para objetos para facilitar o uso no frontend
    return data.map(row => ({
      id: row[0],
      name: row[1],
      course: row[2],
      driveFolderId: row[3],
      instructor: row[4],
      status: row[5]
    }));
  },

  /**
   * Apaga (arquiva) uma sala online.
   */
  delete: function(classId) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("SalasOnline");
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat();
    const rowIndex = data.indexOf(classId);

    if (rowIndex === -1) {
      throw new Error("Sala não encontrada.");
    }
    
    // Altera o status para "Arquivada" na coluna F (índice 6)
    sheet.getRange(rowIndex + 2, 6).setValue("Arquivada");
    
    // (Futuramente, aqui também revogaríamos o acesso dos alunos na aba 'InscricoesOnline')
    
    return "Sala arquivada com sucesso.";
  }
};


// ================================================================
// SERVIÇOS UTILITÁRIOS (FUNÇÕES AUXILIARES)
// ================================================================
const UtilityService = {
  // NOVA FUNÇÃO: Cria um ficheiro a partir de dados Base64
  createFileFromBase64: function(folder, fileData) {
    if (!fileData || !fileData.fileContent) return null;
    const decodedContent = Utilities.base64Decode(fileData.fileContent);
    const blob = Utilities.newBlob(decodedContent, fileData.mimeType, fileData.fileName);
    const file = folder.createFile(blob);
    return file;
  },
  
  // FUNÇÃO MELHORADA: Cria uma pasta para o aluno e retorna o objeto da pasta e o seu URL
  createStudentFolder: function(parentCourseFolderId, firstName, lastName) {
    const parentFolder = DriveApp.getFolderById(parentCourseFolderId);
    const timestamp = Utilities.formatDate(new Date(), "GMT+1", "yyyy-MM-dd");
    const folderName = `${firstName}_${lastName}_${timestamp}`;
    const newFolder = parentFolder.createFolder(folderName);
    return {
      folder: newFolder,
      url: newFolder.getUrl()
    };
  },
  
  createReceiptWithLogo: function(studentData, date) {
    const formattedDate = Utilities.formatDate(date, "GMT+1", "dd 'de' MMMM 'de' yyyy");
    const logoFile = DriveApp.getFileById(LOGO_FILE_ID);
    const logoBase64 = `data:${logoFile.getMimeType()};base64,${Utilities.base64Encode(logoFile.getBlob().getBytes())}`;
    const htmlContent = `
      <html><body>
        <img src="${logoBase64}" alt="Logotipo TecDigital" style="width: 150px;"/>
        <h1 style="color: #0d6efd;">Recibo de Inscrição</h1>
        <p>Este documento confirma a inscrição de <strong>${studentData.firstName} ${studentData.lastName}</strong>.</p>
        <p><strong>Curso:</strong> ${studentData.course}</p>
        <p><strong>Montante Pago:</strong> ${studentData.amount} Kz</p>
        <p><strong>Forma de Pagamento:</strong> ${studentData.paymentMethod}</p>
        <p><strong>Data de Emissão:</strong> ${formattedDate}</p>
        <hr><p><em>TecDigital - A sua plataforma de cursos.</em></p>
      </body></html>
    `;
    const pdfBlob = Utilities.newBlob(htmlContent, MimeType.HTML).getAs(MimeType.PDF);
    pdfBlob.setName(`Recibo_${studentData.firstName}_${studentData.lastName}.pdf`);
    return pdfBlob;
  }
};

// ================================================================
// PROCESSAMENTO EM SEGUNDO PLANO (EXECUTADO POR GATILHO)
// ================================================================
/**
 * Procura por inscrições manuais com status "Processando" e finaliza o registo.
 * Esta função é chamada automaticamente por um gatilho de tempo.
 */
// ================================================================
// PROCESSAMENTO EM SEGUNDO PLANO (EXECUTADO POR GATILHO)
// ================================================================
function processPendingManualRegistrations() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const allSheets = ss.getSheets();
  const excludedSheets = ["Finanças", "Funcionários", "Parceiros", "OutrosServicos", "Suporte", "HashesComprovativos"];

  allSheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (excludedSheets.includes(sheetName) || sheet.getLastRow() < 2) return;

    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12);
    const data = dataRange.getValues();

    data.forEach((row, index) => {
      const currentRow = index + 2;
      const status = row[8];

      if (status === "Processando") {
        try {
          const financialData = JSON.parse(row[10]);
          const filePayload = row[11] ? JSON.parse(row[11]) : null;
          
          // O objeto studentData já tem tudo o que o EmailService precisa
          const studentData = {
            courseName: sheetName, // Corrigido para corresponder ao que o EmailService espera
            firstName: row[1],
            lastName: row[2],
            email: row[3],
            phone: row[4],
            bi: row[5],
            amount: financialData.amount,
            paymentMethod: financialData.paymentMethod
          };

          const parentCourseFolderId = COURSE_FOLDER_IDS[studentData.courseName];
          if (!parentCourseFolderId) throw new Error("ID da pasta do curso não encontrado.");
          const studentFolderInfo = UtilityService.createStudentFolder(parentCourseFolderId, studentData.firstName, studentData.lastName);

          let biFileLink = "";
          if (filePayload) {
            const biFile = UtilityService.createFileFromBase64(studentFolderInfo.folder, filePayload);
            if (biFile) biFileLink = biFile.getUrl();
          }

          sheet.getRange(currentRow, 7, 1, 3).setValues([[biFileLink, "", "Inscrito (Manual)"]]);
          sheet.getRange(currentRow, 11, 1, 2).clearContent();

          const financeSheet = ss.getSheetByName('Finanças');
          const transactionId = "TRANS-" + new Date(row[0]).getTime();
          financeSheet.appendRow([
              transactionId, new Date(row[0]), "Entrada", `Inscrição Manual - ${studentData.firstName} ${studentData.lastName}`,
              studentData.amount, studentData.paymentMethod, "", studentData.courseName, "Pago"
          ]);
            
          // ---> NOVA LINHA ADICIONADA AQUI <---
          // Após todo o sucesso, envia o e-mail de confirmação.
          EmailService.sendApprovalConfirmation(studentData);
            
        } catch (e) {
            Logger.log(`Erro ao processar a linha ${currentRow} da aba ${sheetName}: ${e.toString()}`);
            sheet.getRange(currentRow, 9).setValue("Erro no Processamento");
        }
      }
    });
  });
}

// ================================================================
// FUNÇÃO ESPECIAL PARA AUTORIZAÇÃO MANUAL
// ================================================================
/**
 * Execute esta função UMA VEZ manualmente para autorizar todos os
 * serviços que o script precisa (Planilhas, Drive, Email).
 */
function authorizeServices() {
  try {
    // Força a autorização para as Planilhas Google
    SpreadsheetApp.openById('1uDI5JdGIlFgTjYjJINArq_m4Sq0_hiI96RyiiYG3qqc');
    Logger.log('Acesso às Planilhas autorizado.');

    // Força a autorização para o Google Drive
    DriveApp.getFolderById('1mMD1KsWYXPogYWkjdLUf3tuEORvDFySn');
    Logger.log('Acesso ao Drive autorizado.');

    // Força a autorização para o serviço de Email
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 
                      'Teste de Autorização do Script TecDigital', 
                      'Este é um e-mail de teste para autorizar as permissões do script.');
    Logger.log('Acesso ao MailApp autorizado.');

    Browser.msgBox('Sucesso!', 'Todas as permissões foram autorizadas com sucesso.', Browser.Buttons.OK);

  } catch (e) {
    Logger.log('Ocorreu um erro durante a autorização: ' + e.toString());
    Browser.msgBox('Erro', 'Ocorreu um erro: ' + e.toString(), Browser.Buttons.OK);
  }
}


// Ação: Adicione este novo bloco de código no final do ficheiro.

// ================================================================
// SERVIÇO DE ENVIO DE E-MAIL
// ================================================================
const EmailService = {
  /**
   * Envia um e-mail de confirmação de matrícula para o aluno.
   */
  sendApprovalConfirmation: function(studentData) {
    if (!studentData.email) return; // Não faz nada se o email não estiver disponível

    const logoBlob = DriveApp.getFileById(LOGO_FILE_ID).getBlob();
    const logoData = Utilities.base64Encode(logoBlob.getBytes());
    const logoUrl = `data:${logoBlob.getContentType()};base64,${logoData}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="${logoUrl}" alt="Logotipo TecDigital" style="max-width: 150px;">
          <h1 style="margin: 10px 0 0 0;">Inscrição Aprovada!</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #198754;">Bem-vindo(a) à TecDigital, ${studentData.firstName}!</h2>
          <p>Temos o prazer de informar que a sua inscrição no curso de <strong>${studentData.courseName}</strong> foi confirmada com sucesso.</p>
          <p>Em breve, a nossa equipa entrará em contacto consigo com mais detalhes sobre os próximos passos, incluindo datas de início e acesso aos materiais.</p>
          <p>Poderá sempre verificar o estado da sua inscrição e, futuramente, as suas classificações, na nossa área de consulta no site.</p>
          <p>Estamos ansiosos por começar esta jornada de aprendizagem consigo!</p>
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
      subject: `Matrícula Confirmada - Bem-vindo(a) ao curso de ${studentData.courseName}!`,
      htmlBody: htmlBody
    });
  }
};