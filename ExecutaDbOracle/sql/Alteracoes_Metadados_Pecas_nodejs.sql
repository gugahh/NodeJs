alter table TJRJ.TJRJ_XML_METADADOS_PECAS 
	modify ( XMPP_XML_METADADOS_PECAS NULL );
	
alter table TJRJ.TJRJ_XML_METADADOS_PECAS
drop
(
	XMPP_MTPP_DK		,
	XMPP_TX_ERRO_XML  	,
	XMPP_DT_ERRO  		
);

alter table TJRJ.TJRJ_XML_METADADOS_PECAS 
	add 
( 
	XMPP_XML_METADADOS_PECAS_EXT		CLOB	null , 
	XMPP_DT_ULT_CHAMADA_MNI				DATE	null ,
	XMPP_DT_ULT_CHAMADA_MNI_EXT			DATE	null
);

COMMENT ON COLUMN TJRJ.TJRJ_XML_METADADOS_PECAS.XMPP_XML_METADADOS_PECAS_EXT
	IS 'XML retornado do serviço MNI EXT (MNI alternativo) com os metadados para montagem da árvore de peças. Utilizado principalmente quando ocorre indisponibilidade no MNI padrão.';
COMMENT ON COLUMN TJRJ.TJRJ_XML_METADADOS_PECAS.XMPP_DT_ULT_CHAMADA_MNI IS 'Data/hora em que foi realizada a ultima chamada com sucesso ao MNI para obtenção de Metadados.';
COMMENT ON COLUMN TJRJ.TJRJ_XML_METADADOS_PECAS.XMPP_DT_ULT_CHAMADA_MNI_EXT IS 'Data/hora em que foi realizada a ultima chamada com sucesso ao MNI_EXT para obtenção de Metadados.';

UPDATE TJRJ.TJRJ_XML_METADADOS_PECAS
SET XMPP_DT_ULT_CHAMADA_MNI = NVL(XMPP_DT_ULTIMA_ALTERACAO, XMPP_DT_INCLUSAO)
WHERE XMPP_XML_METADADOS_PECAS IS NOT NULL 
and XMPP_DT_ULT_CHAMADA_MNI is NULL;
commit;

alter table TJRJ.TJRJ_XML_METADADOS_PECAS add CONSTRAINT XMPP_CLOB_PREENCH_CK 
CHECK
( XMPP_XML_METADADOS_PECAS is not null OR XMPP_XML_METADADOS_PECAS_EXT is not null );

alter table TJRJ.TJRJ_XML_METADADOS_PECAS add CONSTRAINT XMPP_DT_MNI_EXT_PREENCH_CK 
CHECK (
	(XMPP_XML_METADADOS_PECAS_EXT is null AND XMPP_DT_ULT_CHAMADA_MNI_EXT is null)
	OR
	(XMPP_XML_METADADOS_PECAS_EXT is not null AND XMPP_DT_ULT_CHAMADA_MNI_EXT is not null)
);

ALTER TABLE TJRJ.TJRJ_XML_METADADOS_PECAS ADD CONSTRAINT XMPP_DT_ULTIMA_ALTERACAO_CK 
CHECK 
(
	XMPP_DT_ULTIMA_ALTERACAO IS NULL 	or
	XMPP_DT_ULTIMA_ALTERACAO >= XMPP_DT_INCLUSAO
);

alter table TJRJ.TJRJ_XML_METADADOS_PECAS add CONSTRAINT XMPP_DT_ULTIMA_CHAMADA_CK
CHECK (
	(
		XMPP_DT_ULT_CHAMADA_MNI is not null AND 
		NVL(XMPP_DT_ULTIMA_ALTERACAO, XMPP_DT_INCLUSAO) >= XMPP_DT_ULT_CHAMADA_MNI
	)
	OR
	(
		XMPP_DT_ULT_CHAMADA_MNI_EXT is not null AND 
		NVL(XMPP_DT_ULTIMA_ALTERACAO, XMPP_DT_INCLUSAO) >= XMPP_DT_ULT_CHAMADA_MNI_EXT
	)
);

ALTER TABLE TJRJ.TJRJ_XML_METADADOS_PECAS
ADD CONSTRAINT XMPP_CD_PROCESSO_CNJ_CK CHECK 
(
	regexp_like(XMPP_CD_PROCESSO_CNJ,'(\d{7}-\d{2}\.\d{4}\.8\.19\.\d{4})')
);

ALTER TABLE TJRJ.TJRJ_XML_METADADOS_PECAS
ADD
(
	XMPP_IN_DEVE_REPROCESSAR CHAR(1) GENERATED ALWAYS 
		AS 
		(
			CASE
				WHEN XMPP_DT_ULT_CHAMADA_MNI is NULL
					THEN 'S'
				WHEN 
				(
					XMPP_DT_ULT_CHAMADA_MNI 	IS NOT NULL AND 
					XMPP_DT_ULT_CHAMADA_MNI_EXT	IS NOT NULL AND
					XMPP_DT_ULT_CHAMADA_MNI_EXT > XMPP_DT_ULT_CHAMADA_MNI
				)
					THEN 'S'
				ELSE 'N'
			END 
		) VIRTUAL 
);

	CREATE INDEX TJRJ.XMPP_IN_DEVE_REPROCESSAR_I 
		ON TJRJ.TJRJ_XML_METADADOS_PECAS (XMPP_IN_DEVE_REPROCESSAR) ;

/* Parte nova */
alter table TJRJ.TJRJ_XML_METADADOS_PECAS add CONSTRAINT XMPP_DT_MNI_PREENCH_CK 
CHECK (
	(XMPP_XML_METADADOS_PECAS is null AND XMPP_DT_ULT_CHAMADA_MNI is null)
	OR
	(XMPP_XML_METADADOS_PECAS is not null AND XMPP_DT_ULT_CHAMADA_MNI is not null)
);

alter table TJRJ.TJRJ_XML_METADADOS_PECAS add CONSTRAINT XMPP_DT_RECON_VALID_CK 
CHECK (
	(XMPP_DT_RECON is null)
	OR
	(XMPP_DT_RECON is not null AND XMPP_XML_METADADOS_PECAS is not null)
);