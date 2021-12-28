const oracledb = require('oracledb');

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Gerador de Massa de Teste de Distribuicao =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 3) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados String de Conexao, usuario e senha como parametros.");
  console.error("* Exemplo: node GeraMassaTesteDistribuicao.js 10.0.251.32:1521/CORR userX senhaX");
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
        { id:1,	matric:'00008796',		nome:'Gustavo' },
        { id:2,	matric:'00004112',		nome:'Mauro' },
        { id:3,	matric:'00007430',		nome:'Sebastian' },
        { id:4,	matric:'00007014',		nome:'Jorge' },
        { id:5,	matric:'00003480',		nome:'Dr. João Alfredo' },
        { id:6,	matric:'00003439',		nome:'Cleudo' },
        { id:7,	matric:'00008295',		nome:'Douglas' }
    ];

    distribuidores.forEach(( distribuidor ) => {

      // TODO: implementar if
      await isDistribuidorCadastrado(connection, distribuidor);
      await cadastraDistribuidor(connection, distribuidor);
      await avancaASequence(connection);
      await cadastraPermissoes(connection, distribuidor);

    });

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

async function isDistribuidorCadastrado(connection, distribuidor) {
    // TODO: implementar
    return false;
};

async function cadastraDistribuidor(connection, distribuidor) {
  console.log(">>> Cadastrando o distribuidor: " + distribuidor.nome);
  await connection.execute (
    `begin
      execute immediate 
      '
        INSERT INTO tjrj_pje_distribuidor (
            pjdt_dk,
            pjdt_cdmatricula,
            pjdt_dt_inclusao,
            pjdt_observacao
        )
        Select
            1,
            '00008796',
            SYSDATE,
            'Usuário Gustavo'
        FROM DUAL;
      ';
    exception when others then if sqlcode <> -942 then raise; end if;
    end;`
  );
  connection.commit();

  console.log("<<< Finalizou o Cadastro do distribuidor: " + distribuidor.nome);
}

// Avancar a sequence ate a quant de distribuidores
async function avancaASequence(connection) {
  console.log(">>> Avancando a sequence em 1 unidade");

  await connection.execute (
    `
    DECLARE
        currSeq         NUMBER;
    BEGIN
        Select tjrj.PJDT_SQ_DK.NEXTVAL into currSeq from DUAL;
        commit ;

    EXCEPTION when others then if sqlcode <> -942 then raise; end if;
    END; 
    `
  );
  connection.commit();
}

async function cadastraPermissoes(connection, distribuidor) {
    console.log(">>> Cadastrando as permissoes do distribuidor: " + distribuidor.nome);
  await connection.execute (
    `
    
    begin
      execute immediate 
      '
        INSERT INTO tjrj_pje_perm_distrib (
            pjpd_dk,
            pjpd_pjdt_dk,
            pjpd_orge_dk,
            pjpd_dt_inclusao,
            pjpd_in_ativo
        )
        SELECT
            TJRJ.PJPD_SQ_DK.NEXTVAL,
            1,                      -- Gustavo
            ORGE.ORGE_ORGA_DK ,
            SYSDATE,
            'S'
        from MPRJ.MPRJ_ORGAO_EXT ORGE
        where ORGE.ORGE_ORGA_DK in
        (
            Select distinct     ORGE2.ORGE_ORGA_DK
              from TJRJ_PJE_AVISO_COMUNIC_INTIM TJAC
                  inner join TJRJ_PJE_MOTIVO_NAO_DISTRIB PJND       on PJND.PJND_DK = TJAC.TJAC_PJND_DK
                  inner join MPRJ.MPRJ_ORGAO_EXT ORGE2              on ORGE2.ORGE_ORGA_DK = TJAC.TJAC_ORGE_DK
            where 1=1
            and PJND.PJND_IN_INTERV_SECRETARIA = 'S'
            and EXISTS
            (
                Select 1 FROM TJRJ_VW_PJE_ORGAO_JULGADOR vwoj
                where vwoj.vwoj_cd_id_org_julgador_mprj = ORGE2.ORGE_ORGA_DK
            )
            and NOT EXISTS
            (
                Select 1
                from tjrj_pje_perm_distrib perm_exist
                where   1=1
                and     perm_exist.pjpd_orge_dk = ORGE2.ORGE_ORGA_DK
                and     perm_exist.pjpd_pjdt_dk = 1 -- Gustavo
            )
        )
      ';
    exception when others then if sqlcode <> -942 then raise; end if;
    end;
    `
  );
  connection.commit();

  console.log("<<< Finalizando Cadastro de permissoes");
}

run();
