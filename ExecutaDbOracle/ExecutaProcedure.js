const fs = require("fs");
const date = require('date-and-time');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;
var p_caminho_script_ddl;

console.log("\n===== Executa Procedure =====");

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
p_caminho_script_ddl = myArgs[3];

// Logando o timestamp atual
var currTimestampStr = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
console.log("Data de Processamento:\t " + currTimestampStr + "\n");

console.log("\nString de Conexão: \t" + p_conn_string);
console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");
console.log("Script de DDL: " + p_caminho_script_ddl + "\n");

async function run() {

  let connection;

  try {

    // Verificando se o arquivo informado existe mesmo.
    if(!fs.existsSync(p_caminho_script_ddl)) {
        console.log('Arquivo DDL não encontrado.');
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
        fileContents = fs.readFileSync(p_caminho_script_ddl, 'utf-8');

        console.log(' Arquivo lido com sucesso. Conteúdo:');
        console.log('-------------------------------------\n');
        console.log(fileContents);
        console.log('\n-------------------------------------\n');

      } catch (err) {
        // Here you get the error when the file was not found,
        // but you also get any other error
        if (err.code === 'ENOENT') {
            console.log('Arquivo DDL não encontrado.');
          } else {
            throw err; //Outro tipo de erro.
          }
      }

    await executaUmStatement(connection, fileContents);
    console.log("\n=========== Executou o Script com sucesso. =============");

    currTimestampStr = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log("   (Finalizado em:\t " + currTimestampStr + ")");
    console.log("=========== Todo o processamento finalizado. ===========");

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

async function executaUmStatement(connection, statemt) {

    console.log("\n>>> Executando.");

    const result = await connection.execute (
        statemt, {} 
    );
    connection.commit();
}

run();
