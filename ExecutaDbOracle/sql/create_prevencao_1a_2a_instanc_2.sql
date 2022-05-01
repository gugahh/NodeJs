CREATE TABLE TJRJ.TJRJ_TP_ORIGEM_PREVENCAO
(
	TOPR_DK              			NUMBER 			NOT NULL ,
	TOPR_NM_TP_ORIGEM    			VARCHAR2(100)	NOT NULL ,
	TOPR_OBS_TP_ORIGEM   			VARCHAR2(500)	NOT NULL ,
	TOPR_IN_EXIBE_APLICACAO 		CHAR(1)			NOT NULL ,
	CONSTRAINT  TOPR_PK PRIMARY KEY (TOPR_DK)
);

ALTER TABLE TJRJ.TJRJ_TP_ORIGEM_PREVENCAO 
ADD CONSTRAINT TOPR_IN_EXIBE_APLICACAO_CK
CHECK ( TOPR_IN_EXIBE_APLICACAO in ('S', 'N') );

GRANT SELECT, INSERT, DELETE, UPDATE ON TJRJ.TJRJ_TP_ORIGEM_PREVENCAO TO rl_tjrj_webserv;

COMMENT ON TABLE TJRJ.TJRJ_TP_ORIGEM_PREVENCAO IS 'Tabela de domínio contendo a origem da prevenção cadastrada.
Os domínios hoje conhecidos são:
  - Prevenção por consulta ao MGP (quando se replica uma prevenção que já existe no MGP).
  - Petição inicial
  - Inclusão Manual
  - Prevenção por redistribuição no Integra.
  - Distribuição Secretaria';
COMMENT ON COLUMN TJRJ.TJRJ_TP_ORIGEM_PREVENCAO.TOPR_DK IS 'Primary key não baseada em sequence.';
COMMENT ON COLUMN TJRJ.TJRJ_TP_ORIGEM_PREVENCAO.TOPR_NM_TP_ORIGEM IS 'Textual descritivo, resumido, do tipo de origem.';
COMMENT ON COLUMN TJRJ.TJRJ_TP_ORIGEM_PREVENCAO.TOPR_OBS_TP_ORIGEM IS 'Descrição informativa, mais completa, do tipo de origem.';
COMMENT ON COLUMN TJRJ.TJRJ_TP_ORIGEM_PREVENCAO.TOPR_IN_EXIBE_APLICACAO IS 'Indica se este tipo de origem deve ser exibido na aplicação que mantém as prevenções, ou não. Domínio: S / N.';

insert into TJRJ.TJRJ_TP_ORIGEM_PREVENCAO (TOPR_DK, TOPR_NM_TP_ORIGEM, TOPR_OBS_TP_ORIGEM, TOPR_IN_EXIBE_APLICACAO) values 
	(1, 'Consulta ao MGP', 'Prevenção é copiada de uma equivalente, já existente no MGP.', 'S');
insert into TJRJ.TJRJ_TP_ORIGEM_PREVENCAO (TOPR_DK, TOPR_NM_TP_ORIGEM, TOPR_OBS_TP_ORIGEM, TOPR_IN_EXIBE_APLICACAO) values 
	(2,	'Petição Inicial', 'Cadastrada por um usuário, imediatamente após gerar um novo número de processo CNJ.', 'S');
insert into TJRJ.TJRJ_TP_ORIGEM_PREVENCAO (TOPR_DK, TOPR_NM_TP_ORIGEM, TOPR_OBS_TP_ORIGEM, TOPR_IN_EXIBE_APLICACAO) values 
	(3,	'Manual', 'Prevenção cadastrada manualmente, via soliciatação.', 'S');
insert into TJRJ.TJRJ_TP_ORIGEM_PREVENCAO (TOPR_DK, TOPR_NM_TP_ORIGEM, TOPR_OBS_TP_ORIGEM, TOPR_IN_EXIBE_APLICACAO) values 
	(4,	'Redistribuição no Integra', 'Prevenção é criada ao redistribuir um aviso do processo, via funcionalidade do Integra Judicial.', 'S');
insert into TJRJ.TJRJ_TP_ORIGEM_PREVENCAO (TOPR_DK, TOPR_NM_TP_ORIGEM, TOPR_OBS_TP_ORIGEM, TOPR_IN_EXIBE_APLICACAO) values 
	(5,	'Distribuição secretaria', 'Aviso não distribuido automatico, secretaria distribuiu manual via funcionalidade do integra judicial', 'S');
COMMIT;

CREATE TABLE TJRJ.TJRJ_PREVENCAO
(
	TPRV_DK              		NUMBER 				NOT NULL ,
	TRPV_ORGE_FK         		NUMBER 				NULL ,		
	TPRV_ORGI_DK         		NUMBER 				NOT NULL ,	
	TPRV_TOPR_DK         		NUMBER 				NOT NULL ,	
	TPRV_CD_PROCESSO_CNJ 		VARCHAR2(50) 		NOT NULL ,	
	TPRV_CPF_OPERADOR    		VARCHAR2(11) 		NOT NULL ,
	TPRV_OBSERVACAO      		VARCHAR2(2000) 		NULL ,
	TPRV_DT_INCLUSAO     		DATE 				DEFAULT SYSDATE 	NOT NULL ,
	TPRV_INSTANCIA_PROC  		NUMBER(1) 			NOT NULL ,
	TPRV_IN_RESTRITO_CAMARA		CHAR(1) 			NULL ,		
	TPRV_IN_REGRA_ATIVA  		CHAR(1) 			NOT NULL ,
	TPRV_DT_INATIVACAO   		DATE 				NULL ,
	
	CONSTRAINT  TPRV_PK PRIMARY KEY (TPRV_DK)
);

ALTER TABLE TJRJ.TJRJ_PREVENCAO
ADD CONSTRAINT TRPV_ORGE_FK FOREIGN KEY (TRPV_ORGE_FK) 
REFERENCES MPRJ.MPRJ_ORGAO_EXT (ORGE_ORGA_DK);

	CREATE  INDEX TJRJ.TPRV_ORGE_FK_I 
	ON TJRJ.TJRJ_PREVENCAO (TRPV_ORGE_FK   ASC);

	CREATE  INDEX TJRJ.TPRV_ORGI_FK_I 
	ON TJRJ.TJRJ_PREVENCAO (TPRV_ORGI_DK   ASC);

ALTER TABLE TJRJ.TJRJ_PREVENCAO
ADD CONSTRAINT TPRV_TOPR_FK FOREIGN KEY (TPRV_TOPR_DK) 
REFERENCES TJRJ.TJRJ_TP_ORIGEM_PREVENCAO (TOPR_DK);

	CREATE  INDEX TJRJ.TPRV_TOPR_FK_I 
	ON TJRJ.TJRJ_PREVENCAO (TPRV_TOPR_DK   ASC);

ALTER TABLE TJRJ.TJRJ_PREVENCAO
ADD CONSTRAINT TPRV_IN_REGRA_ATIVA_CK 
CHECK ( TPRV_IN_REGRA_ATIVA in ('S', 'N') );

ALTER TABLE TJRJ.TJRJ_PREVENCAO
ADD CONSTRAINT TPRV_CD_PROCESSO_CNJ_CK CHECK 
(
	regexp_like(TPRV_CD_PROCESSO_CNJ,'(\d{7}-\d{2}\.\d{4}\.8\.19\.\d{4})')
);

ALTER TABLE TJRJ.TJRJ_PREVENCAO
ADD CONSTRAINT TPRV_INSTANCIA_PROC_CK 
CHECK ( TPRV_INSTANCIA_PROC in (1, 2) );

ALTER TABLE TJRJ.TJRJ_PREVENCAO 
ADD CONSTRAINT TPRV_DT_INATIVACAO_CK CHECK 
( 
    ( TPRV_IN_REGRA_ATIVA = 'S' AND TPRV_DT_INATIVACAO IS NULL )
	OR
    (
        TPRV_IN_REGRA_ATIVA = 'N'           AND 
        TPRV_DT_INATIVACAO IS NOT NULL      AND 
        TPRV_DT_INATIVACAO >= TPRV_DT_INCLUSAO	
    )    
);

ALTER TABLE TJRJ.TJRJ_PREVENCAO 
ADD CONSTRAINT TPRV_RESTRITO_CAMARA_CK 
CHECK 
( 
	( TPRV_IN_RESTRITO_CAMARA is NULL OR TPRV_IN_RESTRITO_CAMARA = 'N' )
	OR
	(
		TPRV_IN_RESTRITO_CAMARA = 'S'	AND
		TPRV_INSTANCIA_PROC = 2			AND
		TRPV_ORGE_FK IS NULL
	)
);

CREATE UNIQUE INDEX TJRJ.TPRV_IN_REGRA_ATIVA_UK 
ON TJRJ.TJRJ_PREVENCAO
(
	TPRV_CD_PROCESSO_CNJ ,
	TPRV_INSTANCIA_PROC ,
	TRPV_ORGE_FK ,
	CASE
		WHEN TPRV_IN_REGRA_ATIVA = 'S' THEN 0 
		ELSE TPRV_DK 
	END
);

GRANT SELECT, INSERT, DELETE, UPDATE 	ON TJRJ.TJRJ_PREVENCAO TO rl_tjrj_webserv;

CREATE SEQUENCE tjrj.TJRJ_SQ_TPRV_DK START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
GRANT SELECT ON tjrj.TJRJ_SQ_TPRV_DK	TO rl_tjrj_webserv;

COMMENT ON TABLE TJRJ.TJRJ_PREVENCAO IS 'Tabela destinada a permitir o cadastramento de regras de prevenção para processos específicos, tanto para o Portal como para o PJE, seja em 1a ou 2a instância.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_DK IS 'Primary Key baseada em sequence.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TRPV_ORGE_FK IS 'Indica de qual órgão julgador a intimação deve ser originada, para que se utilize esta prevenção. Utilize null no caso de qualquer origem. FK para MPRJ_ORGAO_EXT.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_ORGI_DK IS 'Órgão de execução do MPRJ para o qual serão distribuídas as intimações a que se refere este prevento.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_CD_PROCESSO_CNJ IS 'Número do Processo ao qual se aplica esta regra de prevenção.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_CPF_OPERADOR IS 'CPF da pessoa (operador) que cadastrou esta regra de prevenção.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_IN_REGRA_ATIVA IS 'Indica se esta regra de prevenção está ativa ou não. Domínio: S / N.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_OBSERVACAO IS 'Observações referentes a esta regra de prevenção. Opcional.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_DT_INCLUSAO IS 'Data / hora em que esta regra de prevenção foi efetivamente cadastrada.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_INSTANCIA_PROC IS 'Instância processual a que se refere esta prevenção. Domínio: 1 ou 2 (1a ou 2a instância).';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_TOPR_DK IS 'Tipo de origem desta prevenção (ex: Petição Inicial, Redistribuição no Integra). FK para TJRJ_TP_ORIGEM_PREVENCAO.';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_DT_INATIVACAO IS 'Data em que foi inativada esta prevenção. Só pode ser preenchida para registros inativos (TPRV_IN_REGRA_ATIVA é N).';
COMMENT ON COLUMN TJRJ.TJRJ_PREVENCAO.TPRV_IN_RESTRITO_CAMARA IS 'Indicador de se uma prevencao deve ser aplicada somente a intimações oriunda das câmaras. Só faz sentido para a 2ª Instância, e só deve ser marcada caso o órgão julgador seja "qualquer um" (nulo). Domínio: S / N.';