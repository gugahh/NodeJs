const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_conn_string
var p_usuario;
var p_senha;

console.log("\n===== Cria Tabelas Criminais =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 3) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados String de Conexao, usuario e senha como parametros.");
  console.error("* Exemplo: node CadastraDistribuidores.js 10.0.251.32:1521/CORR userX senhaX");
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

    const scriptOrgaoProcedimento = 
    `
    CREATE TABLE TJRJ.TJRJ_PJE_ORGAO_PROCED
    (
        PJO1_DK              NUMBER								NOT NULL ,
        PJO1_ID_ORGAO        NUMBER								NOT NULL ,
        PJO1_NM_ORGAO        VARCHAR2(200)						NOT NULL ,
        PJO1_TP_ORGAO_PROCED NUMBER 							NULL ,
        PJO1_DT_INCLUSAO     DATE 			DEFAULT SYSDATE		NOT NULL ,
        CONSTRAINT  PJO1_PK PRIMARY KEY (PJO1_DK)
    );
    CREATE UNIQUE INDEX TJRJ.PJO1_ID_ORGAO_UK
        ON TJRJ.TJRJ_PJE_ORGAO_PROCED (PJO1_ID_ORGAO ASC) ;
    GRANT SELECT, INSERT, UPDATE, DELETE 
        ON TJRJ.TJRJ_PJE_ORGAO_PROCED
        TO rl_tjrj_webserv;
    CREATE SEQUENCE TJRJ.TJRJ_SQ_PJO1_DK START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
    GRANT SELECT ON tjrj.TJRJ_SQ_PJO1_DK	TO rl_tjrj_webserv;
    COMMENT ON TABLE TJRJ.TJRJ_PJE_ORGAO_PROCED IS 'Tabela de domínio do PJE, contendo as delegacias que participam de procedimentos.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ORGAO_PROCED.PJO1_DK IS 'Primary key baseada em sequence.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ORGAO_PROCED.PJO1_ID_ORGAO IS 'Identificador do órgão de procedimento original do TJRJ / CNJ.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ORGAO_PROCED.PJO1_NM_ORGAO IS 'Nome do órgão de procedimento';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ORGAO_PROCED.PJO1_TP_ORGAO_PROCED IS 'Tipo de órgão de procedimento. Este dado não é usado, por ora, mas consta de nossa fonte de dados.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ORGAO_PROCED.PJO1_DT_INCLUSAO IS 'Data da inclusao deste Orgao de Procedimento na base de dados.';
    `;

    await executaScript(connection, scriptOrgaoProcedimento);
    console.log("===== Executou Criacao de Orgao de Procedimento. =====");

    const scriptTabelaAviso = 
    `
        ALTER TABLE tjrj.tjrj_pje_aviso_comunic_intim ADD
        (
            tjac_in_info_criminal 		CHAR(1) 	NULL ,
            tjac_dt_imp_info_criminal 	DATE		NULL
        );

        COMMENT ON COLUMN tjrj.tjrj_pje_aviso_comunic_intim.tjac_in_info_criminal
        IS 'Informa se foram importados (e estavam presentes, ou nao) os dados criminais do MNI 2.2.3. Domínio:
        S = Dados criminais importados, e existentes
        N = Dados criminais importados, porém inexistentes
        NULO = Dados criminais não foram importados.';

        COMMENT ON COLUMN tjrj.tjrj_pje_aviso_comunic_intim.tjac_dt_imp_info_criminal
        IS 'Data / hora em que foi realizada a importacao de dados criminais do MNI 2.2.3. Deve ser nulo, se os dados crimais ainda não foram importados.';

        ALTER TABLE tjrj.tjrj_pje_aviso_comunic_intim ADD CONSTRAINT tjac_info_criminal_valid_ck
        CHECK
        (
            (
                tjac_in_info_criminal IN ('S', 'N')		AND
                tjac_dt_imp_info_criminal IS NOT NULL	AND
                tjac_dt_imp_info_criminal >= tjac_dt_disponibilizacao
            )
            OR
            (tjac_in_info_criminal IS NULL AND tjac_dt_imp_info_criminal IS NULL)
        );
    `;

    await executaScript(connection, scriptTabelaAviso);
    console.log("===== Executou Alteracao da tabela de aviso. =====");

    const scriptDemaisTabelas = 
    `
    CREATE TABLE TJRJ.TJRJ_PJE_DOC_COMUNIC
    (
        PJDC_DK              NUMBER 							NOT NULL ,  
        PJDC_TJAC_DK         NUMBER 							NOT NULL ,	
        PJDC_ID_DOC_ORIGINAL NUMBER 							NOT NULL ,	
        PJDC_DT_DOCUMENTO    DATE 								NOT NULL ,
        PJDC_NIVEL_SIGILO    NUMBER 							NULL ,
        PJDC_MOVIMENTO       NUMBER 							NULL ,
        PJDC_HASH            VARCHAR2(100) 						NULL ,
        pjdc_ds_doc_cimunic  VARCHAR2(300) 						NULL ,  
        PJDC_DT_INCLUSAO     DATE 					            NOT NULL ,
        CONSTRAINT  PJDC_PK PRIMARY KEY (PJDC_DK)
    );
    
        ALTER TABLE tjrj.tjrj_pje_doc_comunic	ADD CONSTRAINT pjdc_tjac_fk FOREIGN KEY (pjdc_tjac_dk)
            REFERENCES tjrj.tjrj_pje_aviso_comunic_intim (tjac_dk);
    
        CREATE  INDEX  tjrj.pjdc_tjac_fk_i ON tjrj.tjrj_pje_doc_comunic	(pjdc_tjac_dk);
    
        ALTER TABLE tjrj.tjrj_pje_doc_comunic ADD CONSTRAINT pjdc_doc_unico_uk
            UNIQUE (pjdc_id_doc_original, pjdc_tjac_dk);
    
        GRANT SELECT, INSERT, DELETE, UPDATE 	ON tjrj.tjrj_pje_doc_comunic TO rl_tjrj_webserv;
    
        CREATE SEQUENCE tjrj.tjrj_sq_pjdc_dk START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
        GRANT SELECT ON tjrj.tjrj_sq_pjdc_dk	TO rl_tjrj_webserv;
    
    COMMENT ON TABLE TJRJ.TJRJ_PJE_DOC_COMUNIC IS 'Comunicação associada a um processo do PJE. É utilizado apenas em processos criminais.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_DK IS 'Primary Key baseada em sequence.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_TJAC_DK IS 'FK para o aviso associado a este Documento';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_ID_DOC_ORIGINAL IS 'Identificador do documento original do PJE (CNJ)';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_DT_DOCUMENTO IS 'Data em que foi registrado o documento no CNJ';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_NIVEL_SIGILO IS 'Nível de sigilo.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_MOVIMENTO IS 'Movimento associado a este documento';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_HASH IS 'Hash do documento';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.pjdc_ds_doc_cimunic IS 'Descrição da natureza do documento. Exemplo: intimação.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_DOC_COMUNIC.PJDC_DT_INCLUSAO IS 'Data da importação deste registro de Documento.';
    
    CREATE TABLE tjrj.tjrj_pje_processo_crim
    (
        pjcr_dk              			NUMBER 			NOT NULL , 
        pjcr_pjdc_dk         			NUMBER 			NOT NULL , 
        pjcr_nr_processo     			VARCHAR2(25) 	NOT NULL ,
        CONSTRAINT  pjcr_pk PRIMARY KEY (pjcr_dk)
    );
    
        ALTER TABLE tjrj.tjrj_pje_processo_crim
        ADD
        (
            pjcr_nr_processo_s_format VARCHAR2(25) generated always
            AS
            (
                Translate(pjcr_nr_processo,'0123456789-.','0123456789')
            ) virtual
        );
    
    ALTER TABLE tjrj.tjrj_pje_processo_crim ADD CONSTRAINT pjcr_pjdc_fk	FOREIGN KEY (pjcr_pjdc_dk)
        REFERENCES tjrj.tjrj_pje_doc_comunic (pjdc_dk);
    
    CREATE  INDEX  tjrj.pjcr_pjdc_fk_i ON tjrj.tjrj_pje_processo_crim(pjcr_pjdc_dk);
    
    ALTER TABLE tjrj.tjrj_pje_processo_crim ADD CONSTRAINT pjcr_nr_proc_uk
            UNIQUE (pjcr_nr_processo, pjcr_pjdc_dk);
    
    ALTER TABLE TJRJ.tjrj_pje_processo_crim	ADD CONSTRAINT pjcr_nr_proc_valid_ck
        CHECK
        (
            REGEXP_LIKE (
                PJCR_NR_PROCESSO,
                '(\\d{7}-\\d{2}\\.\\d{4}\\.8\\.19\\.\\d{4})'
            )
        );
    
    GRANT SELECT, INSERT, DELETE, UPDATE ON tjrj.tjrj_pje_processo_crim	TO rl_tjrj_webserv;
    
    CREATE SEQUENCE tjrj.tjrj_sq_pjcr_dk START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
    GRANT SELECT ON tjrj.tjrj_sq_pjcr_dk	TO rl_tjrj_webserv;
    
    COMMENT ON TABLE tjrj.tjrj_pje_processo_crim IS 'Processo criminal associado a determinado Processo do CNJ (ligação esta realizada através de um documento).';
    COMMENT ON COLUMN tjrj.tjrj_pje_processo_crim.pjcr_dk IS 'Primary Key baseada em sequence.';
    COMMENT ON COLUMN tjrj.tjrj_pje_processo_crim.pjcr_nr_processo IS 'Número do processo criminal. Espera-se que seja diferente do número do processo CNJ contido na intimação enviada ao MPRJ.';
    COMMENT ON COLUMN tjrj.tjrj_pje_processo_crim.pjcr_nr_processo_s_format IS 'Número do processo criminal, sem formatação. Coluna virtual.';
    COMMENT ON COLUMN tjrj.tjrj_pje_processo_crim.pjcr_pjdc_dk IS 'FK para o Documento (de um processo) ao qual este processo criminal está vinculado.';
    
    CREATE TABLE tjrj.tjrj_pje_fato_criminal
    (
        pjfc_dk              NUMBER 			NOT NULL , 
        pjfc_pjcr_dk         NUMBER 			NOT NULL , 
        pjfc_dt_fato         DATE 				NOT NULL ,
        pjfc_local_fato      VARCHAR2(1000) 	NOT NULL ,
        CONSTRAINT  pjfc_pk PRIMARY KEY (pjfc_dk)
    );
    
    ALTER TABLE tjrj.tjrj_pje_fato_criminal ADD CONSTRAINT pjfc_pjcr_fk	FOREIGN KEY (pjfc_pjcr_dk)
        REFERENCES tjrj.tjrj_pje_processo_crim (pjcr_dk);
    
    CREATE INDEX tjrj.pjfc_pjcr_fk_i ON tjrj.tjrj_pje_fato_criminal	(pjfc_pjcr_dk);
    
    ALTER TABLE tjrj.tjrj_pje_fato_criminal	ADD CONSTRAINT pjfc_fato_crim_uk
            UNIQUE (pjfc_local_fato, pjfc_dt_fato, pjfc_pjcr_dk); 
    
    GRANT SELECT, INSERT, DELETE, UPDATE ON tjrj.tjrj_pje_fato_criminal	TO rl_tjrj_webserv;
    
    CREATE SEQUENCE tjrj.tjrj_sq_pjfc_dk START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
    GRANT SELECT ON tjrj.tjrj_sq_pjfc_dk	TO rl_tjrj_webserv;
    
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_FATO_CRIMINAL.PJFC_DK IS 'Primary key baseada em sequence.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_FATO_CRIMINAL.PJFC_PJCR_DK IS 'FK do Processo criminal ao qual se refere esse fato';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_FATO_CRIMINAL.PJFC_DT_FATO IS 'Data do fato criminal';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_FATO_CRIMINAL.PJFC_LOCAL_FATO IS 'Local (endereço por extenso) do fato criminal.';
    
    CREATE TABLE tjrj.tjrj_pje_endereco_fato_crim
    (
        pjef_dk              NUMBER 			NOT NULL , 
        pjef_pjfc_dk         NUMBER 			NOT NULL , 
        pjef_logradouro      VARCHAR2(500) 		NULL ,
        pjef_numero          VARCHAR2(100)		NULL ,
        pjef_complemento     VARCHAR2(300)		NULL ,
        pjef_bairro          VARCHAR2(200)		NULL ,
        pjef_cidade          VARCHAR2(200)		NULL ,
        pjef_estado          VARCHAR2(50)		NULL ,
        pjef_cep             VARCHAR2(20)		NULL ,
        CONSTRAINT  pjef_pk PRIMARY KEY (pjef_dk)
    );
    
        ALTER TABLE tjrj.tjrj_pje_endereco_fato_crim
        ADD CONSTRAINT pjef_endereco_preench_ck
        CHECK
        (
            pjef_logradouro      IS NOT NULL OR
            pjef_numero          IS NOT NULL OR
            pjef_complemento     IS NOT NULL OR
            pjef_bairro          IS NOT NULL OR
            pjef_cidade          IS NOT NULL OR
            pjef_estado          IS NOT NULL OR
            pjef_cep             IS NOT NULL
        );
    
    
    ALTER TABLE tjrj.tjrj_pje_endereco_fato_crim ADD CONSTRAINT pjef_endereco_fato_uk
            UNIQUE
            (
                pjef_cep ,
                pjef_logradouro ,
                pjef_complemento ,
                pjef_bairro ,
                pjef_cidade ,
                pjef_estado ,
                pjef_numero ,
                pjef_pjfc_dk
            );   
    
    
    ALTER TABLE tjrj.tjrj_pje_endereco_fato_crim ADD CONSTRAINT pjef_pjfc_fk FOREIGN KEY (pjef_pjfc_dk)
        REFERENCES tjrj.tjrj_pje_fato_criminal (pjfc_dk);
            
    CREATE INDEX tjrj.pjef_pjfc_fk_i ON tjrj.tjrj_pje_endereco_fato_crim (pjef_pjfc_dk);
    
    GRANT SELECT, INSERT, DELETE, UPDATE ON tjrj.tjrj_pje_endereco_fato_crim TO rl_tjrj_webserv;
    
    CREATE SEQUENCE tjrj.tjrj_sq_pjef_dk START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
    GRANT SELECT ON tjrj.tjrj_sq_pjef_dk	TO rl_tjrj_webserv;
    
    COMMENT ON TABLE TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM IS 'Endereço onde ocorreu o fato criminal.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_PJFC_DK IS 'FK para o fato criminal ao qual este endereço se refere.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_DK IS 'Primary key baseada em sequence.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_LOGRADOURO IS 'Logradouro do fato criminal';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_COMPLEMENTO IS 'Complemento do logradouro';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_BAIRRO IS 'Bairro do logradouro';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_CIDADE IS 'Cidade do Logradouro';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_ESTADO IS 'Estado do Logradouro';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_CEP IS 'CEP do Endereço';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_ENDERECO_FATO_CRIM.PJEF_NUMERO IS 'Numero associado ao logradouro';
    
    CREATE TABLE TJRJ.TJRJ_PJE_PROCED_ORIGEM
    (
        pjpo_dk              NUMBER			NOT NULL , 
        pjpo_oprc_dk         NUMBER			NOT NULL , 
        pjpo_pjcr_dk         NUMBER 		NOT NULL , 
        pjpo_id_proced_orig  NUMBER			NOT NULL ,
        pjpo_nr_proced       NUMBER			NOT NULL ,
        pjpo_dt_instauracao  DATE			  NOT NULL ,
        pjpo_ano_proc        NUMBER			NULL ,
        pjpo_dt_lavratura    DATE 			NULL ,
        pjpo_nr_protocolo    NUMBER 		NULL ,
        pjpo_tp_origem       NUMBER 		NULL ,
        pjpo_estado_orig     VARCHAR2(2) 	NULL ,
        pjpo_tp_proc         NUMBER 		NULL ,
        CONSTRAINT  pjpo_pk PRIMARY KEY (pjpo_dk)
    );
    
    ALTER TABLE tjrj.tjrj_pje_proced_origem	ADD CONSTRAINT pjpo_proced_unico_uk
        UNIQUE (pjpo_pjcr_dk, pjpo_id_proced_orig);
    
    ALTER TABLE tjrj.tjrj_pje_proced_origem ADD CONSTRAINT pjpo_oprc_fk FOREIGN KEY (pjpo_oprc_dk)
        REFERENCES tjrj.tjrj_pje_orgao_procedimento (oprc_dk);
    CREATE  INDEX  tjrj.pjpo_oprc_fk_i ON tjrj.tjrj_pje_proced_origem	(pjpo_oprc_dk);
    
    ALTER TABLE tjrj.tjrj_pje_proced_origem	ADD CONSTRAINT pjpo_pjcr_fk FOREIGN KEY (pjpo_pjcr_dk)
        REFERENCES tjrj.tjrj_pje_processo_crim (pjcr_dk);
    CREATE  INDEX  tjrj.pjpo_pjcr_fk_i ON tjrj.tjrj_pje_proced_origem	(pjpo_pjcr_dk);
    
    GRANT SELECT, INSERT, DELETE, UPDATE	ON tjrj.tjrj_pje_proced_origem TO rl_tjrj_webserv;
    
    CREATE SEQUENCE tjrj.tjrj_sq_pjpo_dk START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
    GRANT SELECT ON tjrj.tjrj_sq_pjpo_dk	TO rl_tjrj_webserv;
    
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_oprc_DK IS 'FK para o Órgão (ex: delegacia) que registrou o procedimento criminal.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_DK IS 'Primary key baseada em sequence.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_ID_PROCED_ORIG IS 'Identificador (id) original do procedimento, no CNJ.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_NR_PROCED IS 'Número do procedimento, também de acordo com o CNJ.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_DT_INSTAURACAO IS 'Data de instauração do procedimento.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_ANO_PROC IS 'Ano em que foi instaurado o procedimento. Este dado não será validado, e será registrado apenas para caso haja necessidade dele no futuro.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_DT_LAVRATURA IS 'Data da lavratura';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_NR_PROTOCOLO IS 'Número de protocolo desse procedimento.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_TP_ORIGEM IS 'Tipo de Origem. Dado será armazenado, mas não conhecemos ainda o seu domínio.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_ESTADO_ORIG IS 'Estado da união em que foi realizado o procedimento. Ex: RJ';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_PJCR_DK IS 'FK para o processo criminal, do qual esse procedimento faz parte.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PROCED_ORIGEM.PJPO_TP_PROC IS 'Tipo do Procedimento. Dado será armazenado, mas não conhecemos ainda o seu domínio.';
    
    
    CREATE TABLE tjrj.tjrj_pje_parte
    (
        pjpa_dk              NUMBER 	 		NOT NULL , 
        pjpa_pjcr_dk         NUMBER 			NOT NULL , 
        pjpa_nm_parte        VARCHAR2(500) 		NOT NULL ,
        pjpa_tx_outros_nomes VARCHAR2(500) 		NULL ,
        pjpa_tx_alcunhas     VARCHAR2(500) 		NULL ,
        CONSTRAINT  pjpa_pk PRIMARY KEY (pjpa_dk)
    );
    
    ALTER TABLE tjrj.tjrj_pje_parte	ADD CONSTRAINT pjpa_pjcr_fk FOREIGN KEY (pjpa_pjcr_dk)
        REFERENCES tjrj.tjrj_pje_processo_crim (pjcr_dk);
    
    CREATE  INDEX  tjrj.pjpa_pjcr_fk_i	ON tjrj.tjrj_pje_parte	(pjpa_pjcr_dk);
   
    GRANT SELECT, INSERT, DELETE, UPDATE ON tjrj.tjrj_pje_parte	TO rl_tjrj_webserv;
    
    CREATE SEQUENCE tjrj.tjrj_sq_pjpa_dk START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
    GRANT SELECT ON tjrj.tjrj_sq_pjpa_dk	TO rl_tjrj_webserv;
    
    COMMENT ON TABLE TJRJ.TJRJ_PJE_PARTE IS 'Parte (pessoa física ou jurídica) envolvida/relacionada num processo criminal do PJE.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PARTE.PJPA_PJCR_DK IS 'FK do Processo criminal ao qual se refere esta parte.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PARTE.PJPA_DK IS 'Primary key baseada em sequence.';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PARTE.PJPA_NM_PARTE IS 'Nome da parte (pessoa envolvida no processo criminal).';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PARTE.PJPA_TX_OUTROS_NOMES IS 'Outros nomes da parte (pessoa envolvida no processo criminal).';
    COMMENT ON COLUMN TJRJ.TJRJ_PJE_PARTE.PJPA_TX_ALCUNHAS IS 'Alcunha(s) (apelido(s)) pelo(s) qual(is) se conhece a parte (pessoa envolvida no processo criminal).';
    `
    await executaScript(connection, scriptDemaisTabelas);
    console.log("===== Processou demais tabelas. =====");

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

async function executaScript(connection, umScript) {
    const arrInstrucoes = umScript.split(';');
    await executaArrayStatements(connection, arrInstrucoes);
}

async function executaArrayStatements(connection, arrStatements) {
    for ( const umaInstrucao of arrStatements ) {
        if (umaInstrucao != null && umaInstrucao.replace(/\s/g, "") != '') {
            // Nao executa instrucao vazia.
            await executaUmStatement(connection, umaInstrucao);
        }
    };
}

async function executaUmStatement(connection, statemt) {
    console.log(">>> Processando a instrucao: " + statemt);
  
    const result = await connection.execute (
        statemt, {} 
    );
    connection.commit();
}

run();
