const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const fetch = require('cross-fetch');
const date = require('date-and-time');
const util = require('util')


var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Solicita atualizacao de Pecas DCP (2) =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 5) {
  console.error("\n====Erro!====");
  
  console.error("* Devem ser informados os parametros: \n" + 
     "\t- String de Conexao\n" + 
     "\t- usuario \n" +
     "\t- senha \n" +
     "\t- quant de registros a processar \n" +
     "\t- pausa entre registros (em millisegundos) \n" +
    "como parametros.");
  
  console.error("* Exemplo: node ajusta_assinatura_pecas.js 10.0.251.32:1521/CORR userX senhaX 10 10");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];
p_qt_registros = myArgs[3];
p_pausa = myArgs[4];

// validacoes
if (isNaN(parseInt(myArgs[3]))) {
    console.log("ERRO: O parametro p_qt_registros deve ser um numero inteiro");
    return;
} else {
    let qt_regs_num = parseInt(myArgs[3]);

    if (qt_regs_num < 1 || qt_regs_num > 50000) {
        console.log("ERRO: O valor do parametro p_qt_registros deve ser entre 1  e 50000.");
        return;
    }
}

if (isNaN(parseInt(myArgs[4]))) {
    console.log("ERRO: O parametro p_pausa deve ser um numero inteiro");
    return;
} else {
    let pausa_num = parseInt(myArgs[4]);

    if (pausa_num < 0 || pausa_num > 5000) {
        console.log("ERRO: O valor do parametro p_pausa deve ser entre 0 e 5000 (5 segundos).");
        return;
    }
}
// Fim das validacoes

let qt_regs_num = parseInt(myArgs[3]);
let pausa_num = parseInt(myArgs[4]);
let contador = 0;


	// Correcao
	const urlUpdatePecas = 'http://d-extrair-assinatura-digital-peca-dcp.apps.ocpn.mprj.mp.br/dcp/processar/assinatura/peca/processo-iddocumento/$s/$s';

	// Producao
	// const urlUpdatePecas = "";

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

    console.log(`Quant Max de Processos a processar: ${qt_regs_num} - pausa entre processos: ${pausa_num} ms`);

    const horInicio = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log("Horario de inicio:\t " + horInicio + "\n");

    // Utilizar este estilo de loop for para garantir processamento sincrono.

    //console.log(">>> Processando o Aviso: " + aviso);
    let result = await obtemProcessos(connection, qt_regs_num);
    //console.log(result);

    let row;
    // let row = result.resultSet;
    while ((row = await result.resultSet.getRow())) {
      // arrProc.push({cnj: row.CNJ, qtpecas: row.QT_PECAS});
            // console.log(row);
            contador += 1;

            console.log(`> (${contador})\tProcessando ${row.CNJ} - id documento: ${row.ID_DOCUMENTO}`);
            console.log(`\tmttp_dk: ${row.MTPP_DK} - sigilo: ${row.SIGILO} `);
            console.log(`\tfolha virt: ${row.NR_FOLHA_VIRT_MIN} - dt peca: ${date.format(row.DT_PECA,'DD/MM/YYYY')}`);  

            let resultado = await solicitaAtualizarPeca(row.CNJ);
            console.log(`\t${resultado}\n`);

            await delay(pausa_num);
    };

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

async function solicitaAtualizarPeca(cnj, id_documento) {
    // console.log("idProcesso (1): " + idProcesso);
    const getData = async (cnj) => {
        let urlAtualizada = util.format(urlUpdatePecas, cnj, id_documento);
        console.log("URL: " + urlAtualizada);
        /*
        const response = await fetch(urlAtualizada);
        let resultado;
        if (response.ok) {
            resultado = "\tSUCESSO NO UPDATE - Processo: " + cnj;
        } else {
            resultado = "\tFALHA NO UPDATE - Processo: " + cnj;
        }
            */
        //console.log("\t\t\t\tresponse: " + response);
        resultado = 'OK';
        return resultado;
    };
    return await getData(cnj);
}

async function obtemProcessos(connection, numRegistros) {

  var result = await connection.execute(
    `
      SELECT 
          tmpp.MTPP_DK                  AS MTPP_DK        ,
          tmpp.MTPP_NR_PROCESSO_CNJ 	  as CNJ		        ,
          tmpp.MTPP_ID_DOCUMENTO 		    AS ID_DOCUMENTO 	,
          tmpp.MTPP_TTDL_DK		          AS TTDL_DK		    ,
          tmpp.MTPP_IN_SIGILO   	      as SIGILO         ,
          tmpp.MTPP_NR_FOLHA_VIRTUAL    as NR_FOLHA_VIRT  ,
          tmpp.MTPP_DT_DOCUMENTO        as DT_PECA
      FROM TJRJ_METADADOS_PECAS_PROCESSO tmpp 
      WHERE 1=1 
      AND	tmpp.MTPA_DT_EXCLUSAO_PECA IS NULL 
      AND tmpp.MTPP_DT_PESQ_ASSINATURAS IS NULL
      AND tmpp.MTPP_DT_INCLUSAO >= to_date('01/04/2025', 'dd/mm/yyyy')
      AND tmpp.MTPP_VT_IN_VERIF_ASSINAT_DIGIT = 'S'
      AND tmpp.MTPP_TTDL_DK not in ( 92, 179, 86, 187 )
      AND NOT EXISTS 
      (
        SELECT 1
        FROM TJRJ_METADADOS_PECAS_ASSINAT ASS 
        WHERE ASS.MSPA_MTPP_DK = tmpp.MTPP_DK 
      )
      AND ROWNUM <= :pNumRegistros 
 `,
     {pNumRegistros: numRegistros},  
     {
        resultSet: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT
      }
  );

  return result;
}

run();
