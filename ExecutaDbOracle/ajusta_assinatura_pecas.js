const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Solicita atualizacao de Pecas DCP =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 3) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados String de Conexao, usuario e senha como parametros.");
  console.error("* Exemplo: node obtemClassesJorge.js 10.0.251.32:1521/CORR userX senhaX");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];

// console.log("\nString de Conexão: \t" + p_conn_string);
// console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");

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

    //console.log("Conectou ao BD Oracle com sucesso.");

    var idsavisos = [
      7621937
    ];

    

    // Utilizar este estilo de loop for para garantir processamento sincrono.
    for ( const aviso of idsavisos ) {

      await delay(10);

        //console.log(">>> Processando o Aviso: " + aviso);
        var result = await obtemProcessos(connection, 20);
        // console.log(result);

        let row;
        // let row = result.resultSet;
        while ((row = await result.resultSet.getRow())) {
              // console.log(row);
              console.log(`${row.CNJ}`);
        }

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

async function obtemProcessos(connection, numRegistros) {

  var result = await connection.execute(
    `
        SELECT CNJ 
        FROM 
        (
            SELECT 
                DISTINCT(tmpp.MTPP_NR_PROCESSO_CNJ) AS CNJ
            FROM TJRJ_METADADOS_PECAS_PROCESSO tmpp 
            WHERE 1=1 
                AND tmpp.MTPP_TTDL_DK = 86
                -- AND tmpp.MTPP_DT_PESQ_ASSINATURAS IS not NULL
                AND tmpp.MTPP_DT_INCLUSAO >= to_date('01/01/2024', 'dd/mm/yyyy')
                AND NOT EXISTS 
                (
                    SELECT 1
                    FROM TJRJ_METADADOS_PECAS_ASSINAT ASS 
                    WHERE ASS.MSPA_MTPP_DK = tmpp.MTPP_DK 
                )
            ORDER BY 1 ASC 
        )
        Where ROWNUM <= :pNumRegistros 
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
