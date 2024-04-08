-- SELECT SYSDATE FROM dual;

CREATE TABLE TJRJ.TJRJ_PAUTA_SESSAO
(
	PASE_DK              NUMBER 		NOT NULL , 
	PASE_DOCUMENTO       BLOB 			NOT NULL ,
	PASE_NM_ARQUIVO      VARCHAR2(300) 	NOT NULL ,
	PASE_DT_INCLUSAO     DATE 			NOT NULL ,
	PASE_NM_CAMARA       VARCHAR2(200) 	NOT NULL ,
	PASE_NR_CAMARA       VARCHAR2(2) 	NOT NULL ,
	PASE_DT_SESSAO       DATE 			NOT NULL ,
	CONSTRAINT  PASE_PK PRIMARY KEY (PASE_DK)
);

CREATE UNIQUE INDEX TJRJ.PASE_SESSAO_UK 
ON TJRJ.TJRJ_PAUTA_SESSAO 
(
	PASE_DT_SESSAO       , 
	PASE_NM_CAMARA       ,
	PASE_NR_CAMARA       
);

grant select, insert, delete, update on TJRJ.TJRJ_PAUTA_SESSAO TO RL_TJRJ_WEBSERV;
		

create sequence TJRJ.TJRJ_SQ_PASE_DK START WITH 1 INCREMENT BY 1 NOORDER NOCACHE NOCYCLE ;
grant select on TJRJ.TJRJ_SQ_PASE_DK TO RL_TJRJ_WEBSERV;

COMMENT ON TABLE TJRJ.TJRJ_PAUTA_SESSAO IS 'Tabela criada para atender aplicação de download das pautas de sessão. O usuario baixa o arquivo que está armazenado no blob.';
COMMENT ON COLUMN TJRJ.TJRJ_PAUTA_SESSAO.PASE_DK IS 'Primary key gerada por sequence.';
COMMENT ON COLUMN TJRJ.TJRJ_PAUTA_SESSAO.PASE_DOCUMENTO IS 'Contem o arquivo que será baixado, contendo as pautas das sessões.';
COMMENT ON COLUMN TJRJ.TJRJ_PAUTA_SESSAO.PASE_NM_ARQUIVO IS 'Nome do arquivo contendo a pauta das sessões.';
COMMENT ON COLUMN TJRJ.TJRJ_PAUTA_SESSAO.PASE_DT_INCLUSAO IS 'Dat de inclusão deste registro';
COMMENT ON COLUMN TJRJ.TJRJ_PAUTA_SESSAO.PASE_NM_CAMARA IS 'Nome da camara (civel/criminal) à qual se refere a pauta atual.';
COMMENT ON COLUMN TJRJ.TJRJ_PAUTA_SESSAO.PASE_NR_CAMARA IS 'numero da camara (1,2..27),  à qual se refere a pauta atual.';
COMMENT ON COLUMN TJRJ.TJRJ_PAUTA_SESSAO.PASE_DT_SESSAO IS 'Data da sessao, utilizado para mostrar a lista de downloads na tela';
