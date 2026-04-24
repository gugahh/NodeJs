const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const fetch = require('cross-fetch');
const date = require('date-and-time');
const util = require('util')
const fs = require('fs');

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Solicita atualizacao de Assinatura de Pecas do DCP (4) ('RESCALDO') =====");
console.log("Processa as pecas obtidas de um arquivo texto (contendo os IDs).");
console.log("Util para quando conhecemos de antemão os IDs de pecas a serem re-processadas.");

// Servico -  Correcao:
// const urlUpdatePecas = 'http://d-extrair-assinatura-digital-peca-dcp.apps.ocpn.mprj.mp.br/dcp/processar/assinatura/peca/processo-iddocumento/?cnj/?id_documento';

// Producao
const urlUpdatePecas = "http://extrair-assinatura-digital-peca-dcp.apps.ocpn.mprj.mp.br/dcp/processar/assinatura/peca/processo-iddocumento/?cnj/?id_documento";


// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 5) {
  console.error("\n====Erro!====");
  
  console.error("* Devem ser informados os parametros: \n" + 
     "\t- String de Conexao\n" + 
     "\t- usuario \n" +
     "\t- senha \n" +
     "\t- pausa entre registros (em millisegundos) \n" +
     "\t- nome do arquivo contendo os IDs das pecas \n" +
    "como parametros.");
  
  console.error("* Exemplo: node ajusta_assinatura_pecas_4.js 10.0.251.32:1521/CORR userX senhaX 10 idlist.txt");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];
p_pausa = myArgs[3];
p_nm_arquivo_ids = myArgs[4];

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

let pausa_num = parseInt(p_pausa);

// console.log("\nString de Conexão: \t" + p_conn_string);
// console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");


// Gera, a partir de um array, uma lista de arrays com 10 itens;
// Quando o segmento final tiver menos de 10 itens, o que falta sera preenchido com zeros.
function fc_particiona_10_itens(umArr) {
  const result = [];
  for (let i = 0; i < umArr.length; i += 10) {
    const chunk = umArr.slice(i, i + 10);
    while (chunk.length < 10) chunk.push(0);
    result.push(chunk);
  }
  return result;
}

// Abre um arquivo texto do fs, e obtem os ids de pecas, retornando-os
// em um array.
function fc_read_from_int_list(filename) {
  if (!fs.existsSync(filename)) {
    console.error(`Erro: Arquivo nao encontrado: "${filename}"`);
    process.exit(1);
  }

  const result = [];
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+)\s*,?\s*$/);
    if (match) {
      result.push(parseInt(match[1], 10));
    }
  }
  return result;
}


async function processaLote(connection, umLote) {
// Utilizar este estilo de loop for para garantir processamento sincrono.
    console.log('\n>>> Processando o Lote: ' + umLote + '\n');
    let contador = 0;

    let result = await obtemPecas(connection, umLote); 
    //console.log(result);

    let row;

    while ((row = await result.resultSet.getRow())) {
            // console.log(row);

            contador += 1;

            console.log(`> (${contador}) - \tProcessando ${row.CNJ} - id doc: ${row.ID_DOCUMENTO}`);
            console.log(`\ttmttp_dk: ${row.MTPP_DK} - sigilo: ${row.SIGILO} - bytes: ${row.NUM_BYTES}`);
            console.log(`\tfolha virt: ${row.NR_FOLHA_VIRT} - dt peca: ${date.format(row.DT_PECA,'DD/MM/YYYY')}`);  

            let resultado = await solicitaAtualizarPeca(row.CNJ, row.ID_DOCUMENTO);
            console.log(`\t${resultado}\n`);

            //fs.appendFileSync(nomeArquivoIdsProc, row.MTPP_DK + ' ,\n'); //Grava no arquivo de ids, assincronamente.

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

    const horInicio = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log(`Horario de inicio:\t " ${horInicio} \n`);

    // Obtendo os ids do filesystem
    arrPecasTotal = fc_read_from_int_list(p_nm_arquivo_ids);
    console.log(`Qt de Pecas a processar:\t ${arrPecasTotal.length}\n`);

    arrEmLotes = fc_particiona_10_itens(arrPecasTotal);
    console.log(`Qt de lotes a processar: ${arrLotes.length}`);

    for (const umLote of arrEmLotes) {
      console.log(`Processando o lote: ${umLote}`);
       await processaLote(connection, umLote);
    };

    let horFim = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log(`\nFinalizado as: \t ${horFim}`);
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

/**
 * Obtem todos os registros de um lote de 10 itens a serem reprocessados.
 */
async function obtemPecas(connection, umLote) {

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
          tmpp.MTPP_NR_BYTES_PDF        as NUM_BYTES      
      FROM TJRJ_METADADOS_PECAS_PROCESSO tmpp 
      WHERE 1=1 
      AND	tmpp.MTPA_DT_EXCLUSAO_PECA IS NULL 
      AND tmpp.MTPP_DT_PESQ_ASSINATURAS IS NOT NULL
      AND (
        MTPP_TTDL_DK NOT IN(185,45,130,145,39,50,9999,53,90) AND 
        MTPP_NR_PROTOCOLO_PETICAO IS NOT NULL AND 
        MTPP_CD_IDENTIFICADOR_AVISO IS NULL AND 
        MTPP_DT_DOWNLOAD IS NOT NULL AND
        MTPA_DT_EXCLUSAO_PECA IS NULL AND
        LENGTH(TRIM(MTPP_DS_DESCRICAO_DOCUMENTO))>1 AND
        REGEXP_LIKE (MTPP_DS_DESCRICAO_DOCUMENTO,'[A-Za-z]') 
		  )
      and tmpp.MTPP_DK in ( :i0, :i1, :i2, :i3, :i4, :i5, :i6, :i7, :i8, :i9 )
      -- Excluindo os PDFs gigantes
      and (tmpp.MTPP_NR_BYTES_PDF is null OR tmpp.MTPP_NR_BYTES_PDF <= 16000000)
      order by tmpp.MTPP_DK desc 
 `,
     {
        i0: umLote[0], 
        i1: umLote[1], 
        i2: umLote[2], 
        i3: umLote[3], 
        i4: umLote[4], 
        i5: umLote[5], 
        i6: umLote[6], 
        i7: umLote[7], 
        i8: umLote[8], 
        i9: umLote[9] 
     },  
     {
        resultSet: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT
      }
  );

  return result;
}

run();
