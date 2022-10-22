const fs = require("fs");
const date = require('date-and-time');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;
var p_caminho_script_dml;

console.log("\n===== Executa Script DML Qualquer =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 4) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados String de Conexao, usuario, senha e script a ser executado como parametros.");
  console.error("* Exemplo: node ExecutaScriptDdl.js 10.0.251.32:1521/CORR userX senhaX meuscript.sql");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];
p_caminho_script_dml = myArgs[3];

// Logando o timestamp atual
const currTimestampStr = date.format(new Date(),'DD/MM/YYYY HH:mm:ss');
console.log("Data de Processamento:\t " + currTimestampStr + "\n");

console.log("\nString de Conexão: \t" + p_conn_string);
console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");
console.log("Script de DML: " + p_caminho_script_dml + "\n");

async function run() {

  let connection;

  try {

    // Verificando se o arquivo informado existe mesmo.
    if(!fs.existsSync(p_caminho_script_dml)) {
        console.log('Arquivo DML não encontrado.');
        process.exitCode = 1;
        return; //Finaliza a aplicacao.
    }

    connection = await oracledb.getConnection(
            { 
                user: p_usuario, 
                password: p_senha,
                connectionString: p_conn_string
            }
        );

    console.log("Conectou ao BD Oracle com sucesso.");

    var fileContents;

    try {
        fileContents = fs.readFileSync(p_caminho_script_dml, 'utf-8');

        console.log(' Arquivo lido com sucesso. Conteúdo:');
        console.log('-------------------------------------\n');
        console.log(fileContents);
        console.log('\n-------------------------------------\n');

      } catch (err) {
        // Here you get the error when the file was not found,
        // but you also get any other error
        if (err.code === 'ENOENT') {
            console.log('Arquivo DML não encontrado.');
          } else {
            throw err; //Outro tipo de erro.
          }
      }

    await executaScript(connection, fileContents);
    console.log("===== Executou O Script com sucesso. =====");

    console.log("===== Todo o processamento finalizado. =====");

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

async function executaScript(connection, umScript) {
    const arrInstrucoes = umScript.split(';');
    await executaArrayStatements(connection, arrInstrucoes);
}

async function executaArrayStatements(connection, arrStatements) {
    for ( const umaInstrucao of arrStatements ) {
        // Nao executa instrucao vazia.
        if (umaInstrucao != null && umaInstrucao.replace(/\s/g, "") != '') {
            // Nao executa cometarios de linha unica
            if (!isComentarioLinhaUnica(umaInstrucao)) {

                await executaUmStatement(connection, 
                  escapaExprRegex(umaInstrucao));
            } else {
              console.log("\nIgnorou comentario de linha unica: ");
              console.log(umaInstrucao);
            }
        }
    };
}

async function executaUmStatement(connection, statemt) {
    console.log("\n>>> Processando a instrucao: " + statemt);
  
    const result = await connection.execute (
        statemt, {} 
    );
    connection.commit();
}

/**
 * Verifica se uma instrucao eh um comentario de linha unica
 * (estes nao devem ser executados).
 * @param {*} umaInstrucao 
 */
 function isComentarioLinhaUnica(umaInstrucao) {
   var instrucaoTrim = umaInstrucao.replace(/\s/g, "");
   var posInicioComment = instrucaoTrim.indexOf('--');

    if (posInicioComment > -1) {
      if (instrucaoTrim.indexOf('\n', posInicioComment) == -1) {
        return true; // Instrucao eh comment e possui apenas 1 linha.
      }
    }
    return false;
}

/**
 * Caso a instrucao contenha um REGEXP, o conteudo do regexp deve ser
 * "escapado" (trocar / por // ).
 * @param {*} umaInstrucao 
 * @returns conteudo ja escapado
 */
function escapaExprRegex(umaInstrucao) {
    // string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return umaInstrucao;
}

run();
