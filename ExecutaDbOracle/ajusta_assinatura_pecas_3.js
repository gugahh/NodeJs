const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const fetch = require('cross-fetch');
const date = require('date-and-time');
const util = require('util')
const fs = require('fs');
const datefns = require('date-fns');

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Solicita atualizacao de Assinatura de Pecas do DCP (3) =====");
console.log("Versao exploratoria - processa X pecas (param) de um determinado ano/mes final ate um ano/mes inicial, e grava os IDs num arquivo texto.");
console.log("Posteriormente serao verificados quais meses possuem Peças invalidas (pesquisadas, ");
console.log("porem cujas assinaturas nao haviam sido gravadas.");

// Servico -  Correcao:
const urlUpdatePecas = 'http://d-extrair-assinatura-digital-peca-dcp.apps.ocpn.mprj.mp.br/dcp/processar/assinatura/peca/processo-iddocumento/?cnj/?id_documento';

// Producao
// const urlUpdatePecas = "http://extrair-assinatura-digital-peca-dcp.apps.ocpn.mprj.mp.br/dcp/processar/assinatura/peca/processo-iddocumento/?cnj/?id_documento";


// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 7) {
  console.error("\n====Erro!====");
  
  console.error("* Devem ser informados os parametros: \n" + 
     "\t- String de Conexao\n" + 
     "\t- usuario \n" +
     "\t- senha \n" +
     "\t- ano_mes inicial\n" +
     "\t- ano_mes final\n" +
     "\t- quant de registros a processar \n" +
     "\t- pausa entre registros (em millisegundos) \n" +
    "como parametros.");
  
  console.error("* Exemplo: node ajusta_assinatura_pecas.js 10.0.251.32:1521/CORR userX senhaX 2026-04 2024-01 10 10");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];
p_ano_mes_ini = myArgs[3];
p_ano_mes_fim = myArgs[4];
p_qt_registros = myArgs[5];
p_pausa = myArgs[6];

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

// Validando o ano-mes inicial
const regexAnoMes = /^\d{4}-[0-1][0-9]$/;
if (!regexAnoMes.test(p_ano_mes_ini)) {
    console.log("ERRO: O parametro p_ano_mes_ini deve estar na mascara YYYY-MM (ex: 2025-12).");
    return;
}

// Validando o ano-mes final
if (!regexAnoMes.test(p_ano_mes_fim)) {
    console.log("ERRO: O parametro p_ano_mes_fim deve estar na mascara YYYY-MM (ex: 2025-12).");
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

// Gera uma lista de todos os anos-mes, da final para o inicial.
function generateMonthlyDates(endDateStr, startDateStr) {
  const result = [];
  
  let current = new Date(endDateStr + '-01');
  const start = new Date(startDateStr + '-01');
  
  while (!datefns.isAfter(start, current)) {
    result.push(datefns.format(current, 'yyyy-MM'));
    current = datefns.subMonths(current, 1);
  }
  
  return result;
}

async function processaAnoMes(connection, anoMes) {
// Utilizar este estilo de loop for para garantir processamento sincrono.

    let result = await obtemProcessos(connection, qt_regs_num, anoMes); 
    //console.log(result);

    let row;

    // Arquivo que vai armazenar as pecas processadas.
    let nomeArquivoIdsProc = 'lista_pecas_proc_' + anoMes + '.txt';
    await fs.writeFileSync(nomeArquivoIdsProc, ''); //Cria o arquivo.

    while ((row = await result.resultSet.getRow())) {
            // console.log(row);
            contador += 1;

            console.log(`> (${contador}) - (${row.ANO_MES})\tProcessando ${row.CNJ} - id doc: ${row.ID_DOCUMENTO}`);
            console.log(`\ttmttp_dk: ${row.MTPP_DK} - sigilo: ${row.SIGILO} `);
            console.log(`\tfolha virt: ${row.NR_FOLHA_VIRT} - dt peca: ${date.format(row.DT_PECA,'DD/MM/YYYY')}`);  

            let resultado = await solicitaAtualizarPeca(row.CNJ, row.ID_DOCUMENTO);
            console.log(`\t${resultado}\n`);

            //fs.appendFileSync('lista_pecas_proc' + anoMes + '.txt', row.MTPP_DK + ',\n'); // Sincrono
            fs.appendFileSync(nomeArquivoIdsProc, row.MTPP_DK + ' ,\n'); //Grava no arquivo de ids, assincronamente.

            await delay(pausa_num);
    };
}

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

    console.log(`Ano-mes inicial selecionado: ${p_ano_mes_ini}`); 
    console.log(`Ano-mes final selecionado: ${p_ano_mes_fim}`); 
    console.log(`Quant Max de Processos a processar (por mes): ${qt_regs_num} - pausa entre processos: ${pausa_num} ms`);

    const horInicio = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log("Horario de inicio:\t " + horInicio + "\n");

    // Criando a lista de meses a serem processados
    listaAnosMeses = generateMonthlyDates(p_ano_mes_fim, p_ano_mes_ini);
    console.log(listaAnosMeses);

    for (const anoMes of listaAnosMeses) {
       await processaAnoMes(connection, anoMes);
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

async function obtemProcessos(connection, numRegistros, anoMes) {

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
          to_char(tmpp.MTPP_DT_INCLUSAO, 'YYYY-MM') AS ANO_MES
      FROM TJRJ_METADADOS_PECAS_PROCESSO tmpp 
      WHERE 1=1 
      AND	tmpp.MTPA_DT_EXCLUSAO_PECA IS NULL 
      AND tmpp.MTPP_DT_PESQ_ASSINATURAS IS NOT NULL
      AND tmpp.MTPP_DT_PESQ_ASSINATURAS < to_date('01/04/2026', 'dd/mm/yyyy')
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
      AND tmpp.MTPP_TTDL_DK in ( 92, 179, 86, 187 ) -- Apenas os tipos antigos!
      and to_char(tmpp.MTPP_DT_PESQ_ASSINATURAS, 'YYYY-MM') = :pAnoMes
      AND NOT EXISTS 
      (
        SELECT 1
        FROM TJRJ_METADADOS_PECAS_ASSINAT ASS 
        WHERE ASS.MSPA_MTPP_DK = tmpp.MTPP_DK 
      )
      AND ROWNUM <= :pNumRegistros 
      order by tmpp.MTPP_DT_PESQ_ASSINATURAS desc 
 `,
     {pNumRegistros: numRegistros, pAnoMes: anoMes},  
     {
        resultSet: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT
      }
  );

  return result;
}

run();
