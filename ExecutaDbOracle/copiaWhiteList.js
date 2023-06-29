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
    // let idsOrgaos = [];

	let orgaoList = [
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
				// idsOrgaos.push(element.id) ; // Adiciona um item à lista de Ids

				orgaoList.push
				(
						{
							id: 		element.id					,
							nome: 		element.nome				,
							instancia: (element.primeiraInstancia ? 1 : 2)	,
							municipio: element.municipio
						}
				);

				// if (counter >= 9) { console.log('Atingiu counter.'); return false; }
				return true;
			});
			// console.log('DATA: ', data);
		}
	};
	await getData();

	// console.log(idsOrgaos);
	console.log(orgaoList);
    
	// Cleanup da tabela TJRJ_COPIA_WHITELIST
	await limpaTabela(connection);

	//Inserindo itens: Trabalhando em blocos de 10 itens.
	while (true) {
		if (orgaoList.length >= 10) {
			let subArray = orgaoList.splice(0, 10);
			await insereMultiplos(connection, subArray);
		} else {
			break; // Força a saida.
		}
	}

	//Inserindo itens: Trabalhando os ultimos itens (quant < 10).
    // Utilizar este estilo de loop for para garantir processamento sincrono.
    for ( const orgao of orgaoList ) {

      //await delay(10);

        console.log(">>> Processando o idOrgao: " + orgao.id);
        await insereOrgao(connection, orgao);
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

async function insereOrgao(connection, orgao) {
	console.log("\t\t>> Cadastrando o Orgao: " + orgao.id);
  
	const result = await connection.execute (
		`
		INSERT INTO TJRJ.TJRJ_COPIA_WHITELIST
		(
			TJCW_DK					,
			TJCW_ORGI_DK			,
			TJCW_NM_ORGAO			,
			TJCW_INSTANCIA			,
			TJCW_NM_MUNICIPIO		,
			TJCW_DT_INCLUSAO     
		)
		VALUES 
		(
			TJRJ.TJRJ_SQ_TJCW_DK.NEXTVAL	,
			:idOrgao						,
			:nome							,
			:instancia						,
			:municipio						,
			SYSDATE
		)`,
		{ 
			idOrgao:	orgao.id			,
			nome:		orgao.nome 			,
			instancia:	orgao.instancia		,
			municipio:	orgao.municipio
		}
	);
	connection.commit();
  }

  async function insereMultiplos(connection, arrOrgao) {
	console.log("\t\t>> Cadastrando Multiplos Orgaos");
  
	const result = await connection.execute (
		`
		INSERT INTO TJRJ.TJRJ_COPIA_WHITELIST 
		( 		
				TJCW_DK				, 
				TJCW_DT_INCLUSAO	, 
				TJCW_ORGI_DK		, 
				TJCW_NM_ORGAO		, 
				TJCW_INSTANCIA		, 
				TJCW_NM_MUNICIPIO
		)
		SELECT 
			TJRJ.TJRJ_SQ_TJCW_DK.NEXTVAL 	as TJCW_DK			, 
			SYSDATE 						as TJCW_DT_INCLUSAO	,
			TJCW_ORGI_DK			,
			TJCW_NM_ORGAO			,
			TJCW_INSTANCIA			,
			TJCW_NM_MUNICIPIO
		FROM
		(
			SELECT :id0 AS TJCW_ORGI_DK, :nome0 AS TJCW_NM_ORGAO, :inst0 AS TJCW_INSTANCIA, :mun0 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id1 AS TJCW_ORGI_DK, :nome1 AS TJCW_NM_ORGAO, :inst1 AS TJCW_INSTANCIA, :mun1 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id2 AS TJCW_ORGI_DK, :nome2 AS TJCW_NM_ORGAO, :inst2 AS TJCW_INSTANCIA, :mun2 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id3 AS TJCW_ORGI_DK, :nome3 AS TJCW_NM_ORGAO, :inst3 AS TJCW_INSTANCIA, :mun3 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id4 AS TJCW_ORGI_DK, :nome4 AS TJCW_NM_ORGAO, :inst4 AS TJCW_INSTANCIA, :mun4 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id5 AS TJCW_ORGI_DK, :nome5 AS TJCW_NM_ORGAO, :inst5 AS TJCW_INSTANCIA, :mun5 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id6 AS TJCW_ORGI_DK, :nome6 AS TJCW_NM_ORGAO, :inst6 AS TJCW_INSTANCIA, :mun6 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id7 AS TJCW_ORGI_DK, :nome7 AS TJCW_NM_ORGAO, :inst7 AS TJCW_INSTANCIA, :mun7 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id8 AS TJCW_ORGI_DK, :nome8 AS TJCW_NM_ORGAO, :inst8 AS TJCW_INSTANCIA, :mun8 as TJCW_NM_MUNICIPIO  FROM dual UNION ALL
			SELECT :id9 AS TJCW_ORGI_DK, :nome9 AS TJCW_NM_ORGAO, :inst9 AS TJCW_INSTANCIA, :mun9 as TJCW_NM_MUNICIPIO  FROM dual
		)
		`,
		{ 
			id0: arrOrgao[0].id ,  nome0: arrOrgao[0].nome,	inst0: arrOrgao[0].instancia,	mun0:  arrOrgao[0].municipio	,
			id1: arrOrgao[1].id ,  nome1: arrOrgao[1].nome,	inst1: arrOrgao[1].instancia,	mun1:  arrOrgao[1].municipio	,
			id2: arrOrgao[2].id ,  nome2: arrOrgao[2].nome,	inst2: arrOrgao[2].instancia,	mun2:  arrOrgao[2].municipio	,
			id3: arrOrgao[3].id ,  nome3: arrOrgao[3].nome,	inst3: arrOrgao[3].instancia,	mun3:  arrOrgao[3].municipio	,
			id4: arrOrgao[4].id ,  nome4: arrOrgao[4].nome,	inst4: arrOrgao[4].instancia,	mun4:  arrOrgao[4].municipio	,
			id5: arrOrgao[5].id ,  nome5: arrOrgao[5].nome,	inst5: arrOrgao[5].instancia,	mun5:  arrOrgao[5].municipio	,
			id6: arrOrgao[6].id ,  nome6: arrOrgao[6].nome,	inst6: arrOrgao[6].instancia,	mun6:  arrOrgao[6].municipio	,
			id7: arrOrgao[7].id ,  nome7: arrOrgao[7].nome,	inst7: arrOrgao[7].instancia,	mun7:  arrOrgao[7].municipio	,
			id8: arrOrgao[8].id ,  nome8: arrOrgao[8].nome,	inst8: arrOrgao[8].instancia,	mun8:  arrOrgao[8].municipio	,
			id9: arrOrgao[9].id ,  nome9: arrOrgao[9].nome,	inst9: arrOrgao[9].instancia,	mun9:  arrOrgao[9].municipio
		}
	);
	connection.commit();
  }


run();

