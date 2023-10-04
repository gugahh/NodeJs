const fetch = require('cross-fetch');
const oracledb = require('oracledb');
const date = require('date-and-time');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Faz acertos de Movimentos Locais do PJE =====");
const currTimestampStr = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
console.log("Data de Processamento:\t " + currTimestampStr + "\n");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 3) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados String de Conexao, usuario e senha como parametros.");
  console.error("* Exemplo: node copiaWhiteList.js 10.0.251.32:1521/CORR userX senhaX");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];

console.log("\nString de Conexão: \t" + p_conn_string);
console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");

	// Correcao
	// const urlUpdateMovimento = "http://s-tjrj-movimento-processos.apps.ocpn.mprj.mp.br/pje/gravamovimento/";

	// Producao
	const urlUpdateMovimento = "http://recuperar-movimentos-pje.apps.ocpn.mprj.mp.br/pje/gravamovimento/";


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

    console.log("Conectou ao BD Oracle com sucesso.");

	// Array que vai conter os nossos processos.
	let processoList = [];

	const QUANT_MAX_ITENS_PROCESSAM = 5000;

	const obtemListaProcessos = async () => {
			
			console.log(">> Iniciando query de processos - " + getCurrTimestamp());

			let result = await obtemProcessos(connection, QUANT_MAX_ITENS_PROCESSAM);

			console.log("<<> Query de processos finalizada - " + getCurrTimestamp());

			// console.log(mResultList);

			let row;
			let contador = 1;
			
			while ((row = await result.resultSet.getRow())) {
				processoList.push(row);
			}
			console.log(">> Total de Processos Obtidos: " + processoList.length);


			// Utilizar este estilo de loop for para garantir processamento sincrono.
			for ( const item of processoList ) {

				console.log("\n>> (" + contador + ") Processando proc: [" + item.NR_PROCESSO_FORMAT 
				+ "] - total " + item.QUANT + " movimento(s);");
				console.log("\t\tex(1): " + item.MOV_MIN + " - ex(2): " + item.MOV_MAX);

				const currTimestampStr = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
				console.log("\n\tIniciado:\t " + getCurrTimestamp());

				// console.log("\tMovimentos filhos:");

				let movsFilhos = await obtemMovsProcesso(connection, item.NR_PROCESSO);
				// console.log(movsFilhos);

				while ((row = await movsFilhos.resultSet.getRow())) {
					//console.log("\t\tId mov filho: " + row.ID_MOVIMENTO);
					await excluiMovimento(connection, 
						item.NR_PROCESSO, 
						row.ID_MOVIMENTO);
				}

				// Exclui os movs filhos. Atualizando os Movs do Processo.
				const response = await solicitaAtualizarMovimentos(item.NR_PROCESSO);
				console.log("\tResponse: " + response);
				console.log("\n\tFinalizado:\t " + getCurrTimestamp());
				contador++;
			};
		};
	await obtemListaProcessos();
    
    console.log("\n===== Todo o processamento finalizado. =====");

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

function getCurrTimestamp() {
	return date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
}	

async function solicitaAtualizarMovimentos(idProcesso) {
	// console.log("idProcesso (1): " + idProcesso);
	const getData = async (idProcesso) => {
		const urlAtualizada = urlUpdateMovimento + idProcesso;
		// console.log("URL: " + urlAtualizada);
		const response = await fetch(urlAtualizada);
		let resultado;
		if (response.ok) {
			resultado = "\tSUCESSO NO UPDATE - Processo: " + idProcesso;
		} else {
			resultado = "\tFALHA NO UPDATE - Processo: " + idProcesso;
		}
		//console.log("\t\t\t\tresponse: " + response);
		return resultado;
	};
	return await getData(idProcesso);
}

async function obtemProcessos(connection, quantItens) {

	var result = await connection.execute(
	  `
	  WITH STATUS_ULT_AVISO
	  AS 
	  (
		  SELECT AVCI_CD_PROCESSO_CNJ 	AS NR_CNJ_FORMAT, 
				  AVC.AVCI_TEIP_DK 		AS TEIP_DK
		  FROM TJRJ.TJRJ_AVISO_COMUNIC_INTIMACAO AVC
		  WHERE AVC.AVCI_OINT_DK = 2
		  AND AVC.AVCI_DK IN 
		  (
			  SELECT MAX(AVCI_DK)
			  FROM TJRJ.TJRJ_AVISO_COMUNIC_INTIMACAO AVC2
			  WHERE AVC2.AVCI_CD_PROCESSO_CNJ = AVC.AVCI_CD_PROCESSO_CNJ
			  AND AVC.AVCI_NR_INSTANCIA_PROC = AVC2.AVCI_NR_INSTANCIA_PROC
			  AND AVC2.AVCI_OINT_DK = 2
			  AND AVC2.AVCI_TEIP_DK NOT IN(7)
		  )
		  group BY AVCI_CD_PROCESSO_CNJ, AVC.AVCI_TEIP_DK
	  )
	  SELECT * FROM
	  (
		  SELECT 
			  PEMO_NR_PROCESSO_FORMAT 	AS NR_PROCESSO_FORMAT	,
			  sua.TEIP_DK					AS ULT_STATUS			,
			  COUNT(*) 					AS QUANT				,
			  min(PEMO_ID_MOVIMENTO)		AS MOV_MIN				,
			  max(PEMO_ID_MOVIMENTO)		AS MOV_MAX				,
			  PEMO.PEMO_NR_PROCESSO		AS NR_PROCESSO
		  FROM TJRJ_PJE_MOVIMENTO PEMO
			  LEFT JOIN STATUS_ULT_AVISO SUA
				  ON SUA.NR_CNJ_FORMAT = PEMO.PEMO_NR_PROCESSO_FORMAT
		  WHERE PEMO_COD_MOV_NAC IS NULL 
		  AND NVL(PEMO_IN_MOV_LOCAL, 'N') = 'N' 
		  -- AND SUA.TEIP_DK IN (4, 8) -- Respondida, juntada
		  -- AND SUA.TEIP_DK IN (1, 2, 3) -- Pendente, Recebida, Tacita
		  GROUP BY PEMO.PEMO_NR_PROCESSO_FORMAT, SUA.TEIP_DK, PEMO.PEMO_NR_PROCESSO
		  -- HAVING count(*) >= 3
		  ORDER BY PEMO.PEMO_NR_PROCESSO asc 
	  )
	  WHERE ROWNUM <= :quantItens
   `,
	   { quantItens: quantItens },  
	   {
		  resultSet: true,
		  outFormat: oracledb.OUT_FORMAT_OBJECT
		}
	);
  
	return result;
  }

  async function obtemMovsProcesso(connection, numProcesso) {

	var result = await connection.execute(
	  `
	  SELECT PEMO_ID_MOVIMENTO as ID_MOVIMENTO
	  FROM TJRJ_PJE_MOVIMENTO PEMO
	  WHERE PEMO.PEMO_NR_PROCESSO = :numProcesso
	  	AND PEMO_COD_MOV_NAC IS NULL 
	  	AND NVL(PEMO_IN_MOV_LOCAL, 'N') = 'N'
	  ORDER BY PEMO_ID_MOVIMENTO ASC 
   `,
	   { numProcesso: numProcesso },  
	   {
		  resultSet: true,
		  outFormat: oracledb.OUT_FORMAT_OBJECT
		}
	);
  
	return result;
}

async function excluiMovimento(connection, numProcesso, idMovimento) {
	console.log("\t\t Excluindo Movimento: " + idMovimento); // + " do Proc " + numProcesso);
	
	const result = await connection.execute (
		`
		DELETE FROM TJRJ_PJE_MOVIMENTO mov 
		WHERE mov.PEMO_NR_PROCESSO = :numProcesso
		AND mov.PEMO_ID_MOVIMENTO = :idMovimento
		`,
		{
			numProcesso: numProcesso ,
			idMovimento: idMovimento
		} 
	);
	connection.commit();

}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

run();

