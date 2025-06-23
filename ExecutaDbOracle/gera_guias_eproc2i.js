const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const date = require('date-and-time');

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Gera Guias Eproc2i =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 3) {
  console.error("\n====Erro!====");
  
  console.error("* Devem ser informados os parametros: \n" + 
     "\t- String de Conexao\n" + 
     "\t- usuario \n" +
     "\t- senha \n" +
    "como parametros.");
  
  console.error("* Exemplo: node ger_guias_eprod21.js 10.0.251.32:1521/CORR userX senhaX");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];

let contador = 0;

// console.log("\nString de Conexão: \t" + p_conn_string);
// console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");

// Array com os processos a serem, bem, processados.
// let arrProc = [];

async function run() {

  let connection;

  try {

    connection = await oracledb.getConnection(
            { 
                user: p_usuario, 
                password: p_senha,
                connectionString: p_conn_string
            }
        );

    const horInicio = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log("Horario de inicio:\t " + horInicio + "\n");

    // Utilizar este estilo de loop for para garantir processamento sincrono.

    let result = await executaTudo(connection);

    // let row;
    // let row = result.resultSet;
    
    /*
    while ((row = await result.getRow())) {
        console.log(row);
    };
        */

    let horFim = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log("\nFinalizado as:\t " + horFim);
    console.log("<<< ===== Todo o processamento finalizado. =====");

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

  
} // Run 

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function executaTudo(connection) {

  var result = await connection.execute(
    `
    DECLARE
        w_msg_retorno_item	varchar2(2000) := '';
        w_msg_retorno	    varchar2(2000) := '';
        w_recuo_antigos	    NUMBER;			
    BEGIN 
        
        w_recuo_antigos := CASE WHEN TO_NUMBER(to_char(sysdate, 'HH24')) <= 6 THEN 90 ELSE 40 END;
        
        w_msg_retorno := w_msg_retorno || chr(13) ||  '> 1. Processando peticionamentos antigos';
        TJRJ.TJRJ_PA_INTEGRACAO_MGP.pr_saida_pet_eproc2g 
        (
            p_recuo 		=> w_recuo_antigos 		,
            p_processo		=> NULL					,
            p_msg_retorno	=> w_msg_retorno_item
        );
        w_msg_retorno := w_msg_retorno || chr(13) || w_msg_retorno_item;
        
        w_msg_retorno := w_msg_retorno || chr(13) ||  '> 2. Processando guias de entrada - ultimos 7 dias');
        TJRJ.TJRJ_PA_INTEGRACAO_MGP.pr_integracao_eproc_2i 
        (
            p_recuo 		=> 7 		,
            p_avci_dk		=> null		,
            p_msg_retorno	=> w_msg_retorno_item
        );
        w_msg_retorno := w_msg_retorno || chr(13) || w_msg_retorno_item;
        
        w_msg_retorno := w_msg_retorno || chr(13) || '> 3. Processando guias de saida - ultimos 7 dias');
        TJRJ.TJRJ_PA_INTEGRACAO_MGP.pr_saida_pet_eproc2g 
        (
            p_recuo 		=> 7 		,
            p_processo		=> NULL		,
            p_msg_retorno	=> w_msg_retorno_item
        );
        w_msg_retorno := w_msg_retorno || chr(13) || w_msg_retorno_item;

        :ret := w_msg_retorno;
        
    END

 `,
    { ret: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 2000 } }
  );

  return result;
}

run();
