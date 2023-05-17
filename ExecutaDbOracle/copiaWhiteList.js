const fetch = require('cross-fetch');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Copia WhiteList =====");

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

async function run() {

	const urlWhiteList = "https://integra.mprj.mp.br/integrajudicial/api/white-list-orgaos-busca";

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

	// Array que vai conter os nossos orgaos.
    let idsOrgaos = [
    ];

	const getData = async () => {
		const response = await fetch(urlWhiteList);
		let counter = 0;
	
		if (response.ok) {
			const data = await response.json();
			data.every(element => {
				counter++;
				console.log('\nid: ' + element.id + '\tnome: ' + element.nome);
				console.log('counter' + counter);
				idsOrgaos.push(element.id) ; // Adiciona um item à lista de Ids
				// if (counter >= 30) { console.log('Atingiu counter.'); return false;; }
				return true;
			});
			// console.log('DATA: ', data);
		}
	};
	await getData();

	console.log(idsOrgaos);
    
	// Cleanup da tabela TJRJ_COPIA_WHITELIST
	await limpaTabela(connection);

	//Inserindo itens: Trabalhando em blocos de 10 itens.
	while (true) {
		if (idsOrgaos.length >= 10) {
			let subArray = idsOrgaos.splice(0, 10);
			await insereMultiplos(connection, subArray);
		} else {
			break; // Força a saida.
		}
	}

	//Inserindo itens: Trabalhando os ultimos itens (quant < 10).
    // Utilizar este estilo de loop for para garantir processamento sincrono.
    for ( const idOrgao of idsOrgaos ) {

      //await delay(10);

        // console.log(">>> Processando o idOrgao: " + idOrgao);
        await insereOrgao(connection, idOrgao);
        // console.log(result);
    };

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

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function limpaTabela(connection) {
	console.log("\t\t>> Executando o Cleanup da tabela TJRJ_COPIA_WHITELIST");
	const result = await connection.execute (
	`Delete from TJRJ.TJRJ_COPIA_WHITELIST`, {}
	);
	connection.commit();
}

async function insereOrgao(connection, idOrgao) {
	console.log("\t\t>> Cadastrando o Orgao: " + idOrgao);
  
	const result = await connection.execute (
		`
		INSERT INTO TJRJ.TJRJ_COPIA_WHITELIST
		(
			TJCW_DK              ,
			TJCW_ORGI_DK         ,
			TJCW_DT_INCLUSAO     
		)
		VALUES 
		(
			TJRJ.TJRJ_SQ_TJCW_DK.NEXTVAL,
			:idOrgao	,
			SYSDATE
		)`,
		{ idOrgao: idOrgao }
	);
	connection.commit();
  }

  async function insereMultiplos(connection, arrOrgao) {
	console.log("\t\t>> Cadastrando Multiplos Orgaos");
  
	const result = await connection.execute (
		`
		INSERT INTO TJRJ.TJRJ_COPIA_WHITELIST ( TJCW_DK, TJCW_ORGI_DK, TJCW_DT_INCLUSAO )
		SELECT TJRJ.TJRJ_SQ_TJCW_DK.NEXTVAL, TJCW_ORGI_DK, TJCW_DT_INCLUSAO 
		FROM
		(
			SELECT :id0 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id1 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id2 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id3 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id4 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id5 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id6 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id7 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id8 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual UNION ALL
			SELECT :id9 AS TJCW_ORGI_DK, SYSDATE AS TJCW_DT_INCLUSAO FROM dual 
		)
		`,
		{ 
			id0: arrOrgao[0] ,  
			id1: arrOrgao[1] ,  
			id2: arrOrgao[2] ,  
			id3: arrOrgao[3] ,  
			id4: arrOrgao[4] ,  
			id5: arrOrgao[5] ,  
			id6: arrOrgao[6] ,  
			id7: arrOrgao[7] ,  
			id8: arrOrgao[8] , 
			id9: arrOrgao[9]
		}
	);
	connection.commit();
  }


run();

