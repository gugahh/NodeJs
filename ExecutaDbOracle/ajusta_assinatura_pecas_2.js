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

console.log("\n===== Solicita atualizacao de Assinatura de Pecas do DCP (2) =====");

// Servico -  Correcao:
// const urlUpdatePecas = 'http://d-extrair-assinatura-digital-peca-dcp.apps.ocpn.mprj.mp.br/dcp/processar/assinatura/peca/processo-iddocumento/?cnj/?id_documento';

// Producao
const urlUpdatePecas = "http://extrair-assinatura-digital-peca-dcp.apps.ocpn.mprj.mp.br/dcp/processar/assinatura/peca/processo-iddocumento/?cnj/?id_documento";


// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 6) {
  console.error("\n====Erro!====");
  
  console.error("* Devem ser informados os parametros: \n" + 
     "\t- String de Conexao\n" + 
     "\t- usuario \n" +
     "\t- senha \n" +
     "\t- trimestre \n" +
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
p_trimestre = myArgs[3];
p_qt_registros = myArgs[4];
p_pausa = myArgs[5];

// validacoes
if (isNaN(parseInt(p_qt_registros))) {
    console.log("ERRO: O parametro p_qt_registros deve ser um numero inteiro");
    return;
} else {
    let qt_regs_num = parseInt(p_qt_registros);

    if (qt_regs_num < 1 || qt_regs_num > 1000000) {
        console.log("ERRO: O valor do parametro p_qt_registros deve ser entre 1  e 100000.");
        return;
    }
}

// Validando o trimestre
const regexTrimestre = /^\d{4}-[1-4]$/;
if (!regexTrimestre.test(p_trimestre)) {
    console.log("ERRO: O parametro p_trimestre deve estar na mascara YYYY-Q (ex: 2025-1).");
    return;
}

// Validando a pausa
if (isNaN(parseInt(p_pausa))) {
    console.log("ERRO: O parametro p_pausa deve ser um numero inteiro");
    return;
} else {
    let pausa_num = parseInt(p_pausa);

    if (pausa_num < 0 || pausa_num > 5000) {
        console.log("ERRO: O valor do parametro p_pausa deve ser entre 0 e 5000 (5 segundos).");
        return;
    }
}
// Fim das validacoes

let qt_regs_num = parseInt(p_qt_registros);
let pausa_num = parseInt(p_pausa);
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

    console.log(`Trimestre selecionado: ${p_trimestre}`);
    console.log(`Quant Max de Processos a processar: ${qt_regs_num} - pausa entre processos: ${pausa_num} ms`);

    const horInicio = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log("Horario de inicio:\t " + horInicio + "\n");

    // Utilizar este estilo de loop for para garantir processamento sincrono.

    //console.log(">>> Processando o Aviso: " + aviso);
    let result = await obtemProcessos(connection, qt_regs_num, p_trimestre);
    //console.log(result);

    let row;
    // let row = result.resultSet;
    while ((row = await result.resultSet.getRow())) {
      // arrProc.push({cnj: row.CNJ, qtpecas: row.QT_PECAS});
            // console.log(row);
            contador += 1;

            console.log(`> (${contador}) - (${row.TRIMESTRE_DT_INC})\tProcessando ${row.CNJ} - id doc: ${row.ID_DOCUMENTO}`);
            console.log(`\ttmttp_dk: ${row.MTPP_DK} - sigilo: ${row.SIGILO} `);
            console.log(`\tfolha virt: ${row.NR_FOLHA_VIRT} - dt peca: ${date.format(row.DT_PECA,'DD/MM/YYYY')}`);  

            let resultado = await solicitaAtualizarPeca(row.CNJ, row.ID_DOCUMENTO);
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

    const getData = async (cnj) => {
        let urlAtualizada = urlUpdatePecas
          .replace('?cnj', cnj)
          .replace('?id_documento', id_documento);
        // console.log("URL: " + urlAtualizada);

        const response = await fetch(urlAtualizada);
        let resultado;
        if (response.ok) {
            resultado = "\tSUCESSO NO UPDATE - Processo: " + cnj;
        } else {
            resultado = "\tFALHA NO UPDATE - Processo: " + cnj;
        }

        // console.log("\t\t\t\tresponse: ");
        // console.log(await response.json());
        // resultado = 'OK';
        return resultado;
    };
    return await getData(cnj);
}

async function obtemProcessos(connection, numRegistros, trimestre) {

  var result = await connection.execute(
    `
      SELECT 
          tmpp.MTPP_DK                  AS MTPP_DK        ,
          tmpp.MTPP_NR_PROCESSO_CNJ 	  as CNJ		        ,
          tmpp.MTPP_ID_DOCUMENTO 		    AS ID_DOCUMENTO 	,
          tmpp.MTPP_TTDL_DK		          AS TTDL_DK		    ,
          tmpp.MTPP_IN_SIGILO   	      as SIGILO         ,
          tmpp.MTPP_NR_FOLHA_VIRTUAL    as NR_FOLHA_VIRT  ,
          tmpp.MTPP_DT_DOCUMENTO        as DT_PECA        ,
          to_char(tmpp.MTPP_DT_INCLUSAO, 'YYYY-Q') AS TRIMESTRE_DT_INC 
      FROM TJRJ_METADADOS_PECAS_PROCESSO tmpp 
      WHERE 1=1 
      AND	tmpp.MTPA_DT_EXCLUSAO_PECA IS NULL 
      AND tmpp.MTPP_DT_PESQ_ASSINATURAS IS NULL
      AND (
        MTPP_TTDL_DK NOT IN(185,45,130,145,39,50,9999,53,90) AND 
        MTPP_NR_PROTOCOLO_PETICAO IS NOT NULL AND 
        MTPP_CD_IDENTIFICADOR_AVISO IS NULL AND 
        (MTPP_DT_PESQ_ASSINATURAS IS NULL OR MTPP_DT_PESQ_ASSINATURAS<MTPP_DT_DOWNLOAD+.0833333333333333333333333333333333333333) AND
        MTPP_DT_DOWNLOAD IS NOT NULL AND
        MTPA_DT_EXCLUSAO_PECA IS NULL AND
        LENGTH(TRIM(MTPP_DS_DESCRICAO_DOCUMENTO))>1 AND
        REGEXP_LIKE (MTPP_DS_DESCRICAO_DOCUMENTO,'[A-Za-z]') 
		  )
      AND tmpp.MTPP_TTDL_DK not in ( 92, 179, 86, 187 )
      and to_char(tmpp.MTPP_DT_INCLUSAO, 'YYYY-Q') >= :pTrimestre
      AND NOT EXISTS 
      (
        SELECT 1
        FROM TJRJ_METADADOS_PECAS_ASSINAT ASS 
        WHERE ASS.MSPA_MTPP_DK = tmpp.MTPP_DK 
      )
      AND ROWNUM <= :pNumRegistros 
      order by tmpp.MTPP_DT_INCLUSAO desc 
 `,
     {pNumRegistros: numRegistros, pTrimestre: trimestre},  
     {
        resultSet: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT
      }
  );

  return result;
}

run();
