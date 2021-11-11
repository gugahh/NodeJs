const oracledb = require('oracledb');

var myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
var p_usuario;
var p_senha;

if (!Array.isArray(myArgs) || myArgs.length != 2) {
  console.error("Devem ser informados usuario e senha (do banco) como parametros.");
  process.exit();
}

p_usuario = myArgs[0];
p_senha = myArgs[1];

console.log("\nUsuario: \t" + p_usuario + "\nSenha: \t\t(Foi atribuída)."  + "\n");

async function run() {

  let connection;

  try {

    connection = await oracledb.getConnection(
            { 
                user: p_usuario, 
                password: p_senha,
                connectionString: "10.0.251.32/CORR" 
            }
        );

    console.log("Conectou ao BD Oracle com sucesso.");

    var quant = await obtemQuantOJCadastrados(connection);

    if (quant > 30) {
      console.log("Mais que 30 registros!");
    }
    else {
      console.log("Aparentemente ainda nao executou.");
    }

    console.log("quant Orgaos Julgadores: " + quant );

    await cadastraOJ(connection);

    await cadastraPromotorias(connection);

    await alteraMotivoNaoDistr(connection);

    await processaAvisos(connection);

    await processaIntimacoesPJE(connection);

    let quantDiasRecuo = 5;

    // Realizando a migração de 5 em 5 registros, pq ela eh lenta.
    while (quantDiasRecuo <= 50) {
      await migraIntimacoesPJE(connection, quantDiasRecuo);
      quantDiasRecuo += 5;
    }

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

async function obtemQuantOJCadastrados(connection) {
  console.log(">>> Iniciando Contagem Orgaos Julgadores ");
  var result = await connection.execute(
    `Select count(*) as quant
    from TJRJ_MP_PJE_ORGAO_JULGADOR mpoj 
    where MPOJ.TJPG_DT_IMPLANTACAO is not null`,
    [],
    { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });

  const rs = result.resultSet;
  let row;

  var quant;
  while ((row = await rs.getRow())) {
    quant = row.QUANT;
  }

  await rs.close();
  console.log("<<< Finalizado Contagem Orgaos Julgadores ");

  return quant;
}

async function cadastraOJ(connection) {
  console.log(">>> Iniciando Implantacao de Orgaos Julgadores");
  await connection.execute (
    `begin
      execute immediate 
      '
          update TJRJ_MP_PJE_ORGAO_JULGADOR mpoj 
          set MPOJ.TJPG_DT_IMPLANTACAO = trunc(sysdate)-50
          where MPOJ.TJPG_TJOJ_DK in 
          (
              select  POJ.TJOJ_DK
              from TJRJ.TJRJ_PJE_AVISO_COMUNIC_INTIM pavc
              inner join TJRJ.TJRJ_PJE_ORGAO_JULGADOR poj 
                on POJ.TJOJ_ID_OJ_TJRJ=to_number(PAVC.TJAC_CD_ORGAO_JULGADOR)
              where PAVC.TJAC_DT_DISPONIBILIZACAO >= trunc(sysdate)-50
              group by POJ.TJOJ_DK
              having count(1) > 10
          )
          and MPOJ.TJPG_DT_IMPLANTACAO is null
      ';
    exception when others then if sqlcode <> -942 then raise; end if;
    end;`
  );
  connection.commit();

  console.log("<<< Finalizou Implantacao de Orgaos Julgadores");
}

async function cadastraPromotorias(connection) {
  console.log(">>> Iniciando Cadastro de Promotorias");

  await connection.execute (
    `begin
      execute immediate 
      '
      insert into TJRJ_PJE_IMPLANTACAO_ORGAO m
      (
        M.PJIO_DK,
        M.PJIO_ORGI_DK,
        M.PJIO_DT_IMPLANTACAO,
        M.PJIO_DT_INCLUSAO,
        M.PJIO_IN_PREVENCAO_MCA 
      )
      select
        TJRJ.TJRJ_SQ_PJIO_DK.nextval,
        orgi_dk,
        trunc(sysdate) - 50,
        sysdate,
        ''N''
      from orgi_orgao oo
      left join TJRJ_PJE_IMPLANTACAO_ORGAO m 
        on M.PJIO_ORGI_DK= OO.ORGI_DK
      where OO.ORGI_DT_FIM is null
      and M.PJIO_DT_INCLUSAO is null
      and oo.orgi_dk in 
      (
          select distinct
                   promo2.orgi_dk
          from mcpr_vw_movimentacao_func mfun
          inner join orgi_orgao secret
            on secret.orgi_dk=mfun.cdorgao and secret.ORGI_TPOR_DK = 7
          inner join orgi_orgao secret2 
            on secret2.ORGI_DK  = SECRET.ORGI_DK
            and  (secret2.ORGI_DT_FIM is null or secret2.ORGI_DT_FIM   >= trunc(sysdate))          
          inner join ORGI.ORGI_AUXILIA promos
            on promos.ORAU_ORGI_DK = secret2.ORGI_DK
          inner join orgi_orgao promo2 
            on PROMO2.ORGI_DK  = PROMOS.ORAU_ORGI_DK_AUXILIA
            and  (promo2.ORGI_DT_FIM is null or promo2.ORGI_DT_FIM   >= trunc(sysdate))
          inner join ORGI_CORRESP_EXT   oce
            on OCE.COEX_ORGI_DK = promo2.orgi_dk
            and (OCE.COEX_DT_FIM is null or OCE.COEX_DT_FIM >= trunc(sysdate))
          inner join MPRJ.MPRJ_ORGAO_EXT moe
            on MOE.ORGE_ORGA_DK=OCE.COEX_ORGE_ORGA_DK  
            and MOE.ORGE_TPOE_DK in (63,64,65)                                  
          inner join TJRJ_MP_PJE_ORGAO_JULGADOR mpoj 
            on MPOJ.TJPG_ORGE_DK=MOE.ORGE_ORGA_DK
            and MPOJ.TJPG_DT_IMPLANTACAO is not null
            and MPOJ.TJPG_DT_IMPLANTACAO <= trunc(sysdate)    
          inner join  TJRJ.TJRJ_PJE_ORGAO_JULGADOR poj 
            on POJ.TJOJ_DK=MPOJ.TJPG_TJOJ_DK
          where 1=1
      )
      ';
    exception when others then if sqlcode <> -942 then raise; end if;
    end;`
  );

  connection.commit();

  console.log("<<< Finalizando Cadastro de Promotorias");
}

async function alteraMotivoNaoDistr(connection) {
  console.log(">>> Iniciando alteraMotivoNanDistr");
  await connection.execute (
    `begin
      execute immediate 
      '
        update TJRJ_PJE_MOTIVO_NAO_DISTRIB mnd 
        set MND.PJND_IN_INTERV_SECRETARIA=''S''
        where MND.PJND_DS_MOTIVO=''Sem regra de cálculo de dígito''
      ';
    exception when others then if sqlcode <> -942 then raise; end if;
    end;`
  );

  connection.commit();
  console.log("<<< Finalizando alteraMotivoNanDistr");
}

async function processaAvisos(connection) {
  console.log(">>> Iniciando processaAvisos");
  await connection.execute (
    `begin
        tjrj.tjrj_pa_pje.pr_processa_aviso_pje;
        commit;
    exception when others then if sqlcode <> -942 then raise; end if;
    end;`
  );

  connection.commit();
  console.log("<<< Finalizando processaAvisos");
}

async function processaIntimacoesPJE(connection) {
  console.log(">>> Iniciando processaIntimacoesPJE");
  await connection.execute (
    `begin
        tjrj.tjrj_pa_pje.pr_processa_aviso_pje;
        commit;
    exception when others then if sqlcode <> -942 then raise; end if;
    end;`
  );

  connection.commit();
  console.log("<<< Finalizando processaIntimacoesPJE");
}

async function migraIntimacoesPJE(connection, numDiasRecuo) {
  console.log(">>> Iniciando migraIntimacoesPJE");
  console.log("Recuando: [" + numDiasRecuo + "] dias");
  await connection.execute (
    `begin
    tjrj.tjrj_pa_pje.pr_migra_intimacao_pje( :numdiasP );
      commit;
    end;`, { numdiasP: numDiasRecuo } );

  connection.commit();
  console.log("<<< Finalizando processaIntimacoesPJE");
}

run();
