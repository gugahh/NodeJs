const oracledb = require('oracledb');
const date = require('date-and-time');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Cadastra Distribuidores do Comite gestor no PJE =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 3) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados String de Conexao, usuario e senha como parametros.");
  console.error("* Exemplo: node CadastraDistribuidoresComiteGestor.js 10.0.251.32:1521/CORR userX senhaX");
  console.error("* Obs: Nao utilize espacos na definicao da String de Conexao.\n");
  process.exit();
}

p_conn_string = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];

console.log("\nString de Conexão: \t" + p_conn_string);
console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");

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

    var distribuidores = [
        { matricula:'00007014',		nome: 'Jorge Eduardo de Melo' },
        { matricula:'00005514',		nome: 'Fabiola Resende Rodigues'},
        { matricula:'00003480',		nome: 'Dr. João Alfredo' },
		{ matricula:'00002825',		nome: 'Dra. Karina Rachel Tavares Santos'},
		{ matricula:'00003225',		nome: 'Dr. Bernardo Maciel Vieira'}
    ];

    // Logando o timestamp atual
    const currTimestampStr = date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss');
    console.log("Data de Processamento:\t " + currTimestampStr + "\n");

    // Utilizar este estilo de loop for para garantir processamento sincrono.
    for ( const distribuidor of distribuidores ) {

      console.log(">>> Processando o usuario: " + distribuidor.nome + " - " + distribuidor.matricula);
      // TODO: implementar if
      var idDistribuidor = await obtemIdDistribuidorJaCadastrado(connection, distribuidor);
	  //console.log("\Id do Usuario: " + idDistribuidor);

      if (!isNaN(idDistribuidor) && idDistribuidor != null) {
        console.log("\tUsuário Ja esta cadastrado. Cadastrando apenas Permissões.");
      } else {
        console.log("\tNAO Esta cadastrado. Cadastrando Usuario.");

        idDistribuidor = await obtemNovoIdDistribuidor(connection);
        console.log("\t\t>> Novo Id: " + idDistribuidor);

        await cadastraDistribuidor(connection, distribuidor, idDistribuidor);
      }
	  console.log("\Cadastrando Permissões do Usuario.");
	  console.log("\Id do Usuario: " + idDistribuidor);
	  await cadastraPermissaoComarcas(connection, idDistribuidor);

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

async function obtemIdDistribuidorJaCadastrado(connection, distribuidor) {

  var result = await connection.execute(
    `
    BEGIN
        SELECT di.PJDT_DK into :idUsuario
        FROM dual 
		left join tjrj_pje_distribuidor di 
			on pjdt_cdmatricula = :matricula ;
     END; `,
     {
        matricula:  distribuidor.matricula,
        idUsuario : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT } // Variavel de Bind "OUT"
      } 
  );
  return result.outBinds.idUsuario; 
}

async function obtemNovoIdDistribuidor(connection) {
  const result = await connection.execute(
    `BEGIN
        :id := TJRJ_SQ_PJTD_DK.NEXTVAL;
     END; `,
    {
      id : {type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    } // Variavel de Bind "OUT"
  );
  
  return result.outBinds.id; 
}

// Cadastra um novo distribuidor.
async function cadastraDistribuidor(connection, distribuidor, idDistribuidor) {
  console.log("\t\t>> Cadastrando o distribuidor: " + distribuidor.nome);

  const result = await connection.execute(
    `INSERT INTO tjrj_pje_distribuidor 
    (
      pjdt_dk           ,
      pjdt_cdmatricula  ,
      pjdt_dt_inclusao  ,
      pjdt_observacao
    )
    Select
      :id  ,
      :matricula               ,
      SYSDATE                  ,
      :observacao
    FROM DUAL `,
    {
      id:         idDistribuidor ,
      matricula:  distribuidor.matricula   ,
      observacao: distribuidor.nome
    } 
  );
  connection.commit();
}

// Cadastra permissoes em todos as Comarcas (independente de ter orgaos no PJE ou nao).
async function cadastraPermissaoComarcas(connection, idDistribuidor) {
  console.log("\t\t>> Cadastrando as permissoes do distribuidor de id: " + idDistribuidor);
  
  const result = await connection.execute(
    `
		INSERT INTO tjrj.tjrj_pje_perm_distrib 
		(
			pjpd_dk,
			pjpd_pjdt_dk,
			PJPD_CMRC_DK,
			pjpd_dt_inclusao,
			pjpd_in_ativo
		)
		SELECT
			TJRJ.PJPD_SQ_DK.NEXTVAL ,
			:idDistribuidor         ,
			CMRC.CMRC_DK			,
			SYSDATE,
			'S'
		from ORGI.ORGI_COMARCA CMRC
		where CMRC.CMRC_DK IN 
		(
			SELECT CMRC2.CMRC_DK 
			FROM ORGI.ORGI_COMARCA CMRC2
			WHERE NOT exists
			(
				Select 1
				from tjrj.tjrj_pje_perm_distrib perm_exist
				where   perm_exist.PJPD_CMRC_DK = CMRC2.CMRC_DK
				and     perm_exist.pjpd_pjdt_dk = :idDistribuidor
			)
		)
    `,
    { idDistribuidor: idDistribuidor } 
  );
  connection.commit();
}

run();
