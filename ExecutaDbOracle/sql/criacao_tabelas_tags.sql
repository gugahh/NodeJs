CREATE OR REPLACE VIEW TJRJ.TJRJ_VW_AVISO_TAG 
(
	VWAT_AVCI_DK			,
	VWAT_TAAV_DK			,
	VWAT_TGPR_DK			,
	VWAT_TIPO_ASSOCIACAO	,
	VWAT_ORDENACAO			,
	VWAT_CD_PROCESSO_CNJ	,
	VWAT_NR_INSTANCIA_PROC	,
	VWAT_TJRA_DK			,
	VWAT_TACU_DK			,
	VWAT_ORGI_DK			,
	VWAT_DS_TAG				,
	VWAT_NM_COR_TAG
) 
AS 
  SELECT 
	VWAT_AVCI_DK			,
	VWAT_TAAV_DK			,
	VWAT_TGPR_DK			,
	VWAT_TIPO_ASSOCIACAO	,
	VWAT_ORDENACAO			,
	VWAT_CD_PROCESSO_CNJ	,
	VWAT_NR_INSTANCIA_PROC	,
	VWAT_TJRA_DK			,
	VWAT_TACU_DK			,
	VWAT_ORGI_DK			,
	VWAT_DS_TAG				,
	VWAT_NM_COR_TAG 
  FROM 
	(
		SELECT
			avc.AVCI_DK						AS VWAT_AVCI_DK				,
			tgav.TAAV_DK 					AS VWAT_TAAV_DK				, 
			NULL							AS VWAT_TGPR_DK				, 
			'I'								AS VWAT_TIPO_ASSOCIACAO		, 
			tgav.TAAV_ORDENACAO 			AS VWAT_ORDENACAO			, 
			avc.AVCI_CD_PROCESSO_CNJ		AS VWAT_CD_PROCESSO_CNJ		,
			avc.AVCI_NR_INSTANCIA_PROC		AS VWAT_NR_INSTANCIA_PROC	,
			avc.AVCI_TJRA_DK				AS VWAT_TJRA_DK				, 
			tag.TACU_DK						AS VWAT_TACU_DK				, 
			tag.TACU_ORGI_DK				AS VWAT_ORGI_DK				, 
			tag.TACU_DS_TAG					AS VWAT_DS_TAG				,
			tag.TACU_NM_COR_TAG				AS VWAT_NM_COR_TAG
		FROM TJRJ_AVISO_COMUNIC_INTIMACAO avc 
			inner JOIN TJRJ.TJRJ_TAG_AVISO tgav ON tgav.TAAV_AVCI_DK = avc.AVCI_DK 
			inner JOIN TJRJ.TJRJ_TAG_CUSTOMIZADA tag ON tag.TACU_DK = TGAV.TAAV_TACU_DK 
		WHERE tag.TACU_ORGI_DK = avc.AVCI_ORGI_DK -- Exibir apenas tags da ultima distribuicao
		
		UNION
		
		SELECT 
			AVC.AVCI_DK 					AS VWAT_AVCI_DK				,
			NULL		 					AS VWAT_TAAV_DK				, 
			TAPR.TGPR_DK 					AS VWAT_TGPR_DK				, 
			'P'								AS VWAT_TIPO_ASSOCIACAO		, 
			TAPR.TGPR_ORDENACAO  			AS VWAT_ORDENACAO			, 
			avc.AVCI_CD_PROCESSO_CNJ 		AS VWAT_CD_PROCESSO_CNJ		,
			1								AS VWAT_NR_INSTANCIA_PROC	,
			TJRA.TJRA_DK					AS VWAT_TJRA_DK				, 
			tag.TACU_DK						AS VWAT_TACU_DK				, 
			tag.TACU_ORGI_DK				AS VWAT_ORGI_DK				, 
			tag.TACU_DS_TAG					AS VWAT_DS_TAG				,
			tag.TACU_NM_COR_TAG				AS VWAT_NM_COR_TAG
		FROM TJRJ.TJRJ_TAG_PROCESSO_AVISO TAPR 
			INNER JOIN TJRJ_PROCESSO_AVISO TJRA   ON TJRA.TJRA_DK = TAPR.TGPR_TJRA_DK 
			INNER JOIN TJRJ_AVISO_COMUNIC_INTIMACAO avc ON avc.AVCI_TJRA_DK = TJRA.TJRA_DK
		INNER JOIN TJRJ.TJRJ_TAG_CUSTOMIZADA tag ON tag.TACU_DK = TAPR.TGPR_TACU_DK 
		WHERE tag.TACU_ORGI_DK = avc.AVCI_ORGI_DK
	)
	WHERE 1=1
	ORDER BY 
		VWAT_AVCI_DK ASC ,
		VWAT_TIPO_ASSOCIACAO 	DESC	,
		VWAT_DS_TAG 			ASC	
	;

GRANT SELECT ON TJRJ.TJRJ_VW_AVISO_TAG TO RL_TJRJ_WEBSERV;
GRANT SELECT ON TJRJ.TJRJ_VW_AVISO_TAG TO RL_INTG_JUDI;

COMMENT ON TABLE TJRJ.TJRJ_VW_AVISO_TAG IS 'View que exibe as tags associadas a um aviso ou ao processo associado ao aviso.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_AVCI_DK IS 'Id do aviso que está associado a Tags';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_TAAV_DK IS 'Id da associação entre um aviso e uma tag. DK da tabela TJRJ_TAG_AVISO.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_TGPR_DK IS 'Id da associação entre um processo e uma tag. DK da tabela TJRJ_TAG_PROCESSO_AVISO.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_TIPO_ASSOCIACAO IS 'Tipo de associação da tag: (I) associação à Intimacao, (P) associação ao Processo';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_ORDENACAO IS 'Ordenção da Tag';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_CD_PROCESSO_CNJ IS 'Código do Processo (CNJ) associado ao aviso.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_NR_INSTANCIA_PROC IS 'Instância processual associada ao aviso.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_TJRA_DK IS 'Id do Processo-aviso ao qual o aviso esta associado. FK para TJRJ_PROCESSO_AVISO.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_TACU_DK IS 'Id da tag que está sendo listada. FK para TJRJ_TAG_CUSTOMIZADA.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_ORGI_DK IS 'Id do órgão ao qual a tag está associada. Fk para ORGI_ORGAO.';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_DS_TAG IS 'Texto da Tag. Ex: Prioridade';
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_NM_COR_TAG IS 'Nome da cor a ser aplicada à Tag, de acordo com o padrão da equipe de front-end. Ex: SUCCESS_LIGHTEST.';


CREATE OR REPLACE VIEW TJRJ.TJRJ_VW_INTIMACAO (TJIT_NR_PROCESSO, TJIT_NR_PROCESSO_SF, TJIT_INSTANCIA, TJIT_CD_ID_AVISO, TJIT_AVCI_DK, TJIT_CD_PROCESSO_UNICO, TJIT_ULTIMO_STATUS, TJIT_DT_EXPEDICAO, TJIT_DT_ABERTURA_AVISO, TJIT_ORGI_DK_DISTRIBUICAO, TJIT_NM_ORGAO_DISTRIBUIDO, TJIT_NM_ORGAO_DISTRIB_ABREV, TJIT_TP_ORGAO, TJIT_CD_MATRICULA_DISTRIBUICAO, TJIT_NM_MEMBRO_RESPONSAVEL, TJIT_CD_MATRICULA_ABERTURA, TJIT_NM_MEMBRO_ABERTURA_AVISO, TJIT_CLASSE_DK, TJIT_DS_CLASSE_PROCESSO, TJIT_COMPETENCIA_DK, TJIT_NM_COMPETENCIA, TJIT_IN_REU_PRESO, TJIT_IN_SIGILOSO, TJIT_IN_IDOSO, TJIT_IN_DOENCA_GRAVE, TJIT_IN_PRECISA_INTERVENCAO_MP, TJIT_IN_INCORRETO, TJIT_TX_MOTIVO_INCORRRETO, TJIT_ORGAO_EXECUCAO, TJIT_NIVEL_SIGILO, TJIT_ORGI_DK_ULT, TJIT_TEIP_DK_ULT, TJIT_DS_MANIFESTACAO, TJIT_DT_PET_ANTERIOR_NI, TJIT_NM_ORGAO_ORIGEM, TJIT_MATE_DK, TJIT_DT_ULTIMA_ATUALIZACAO_MNI, TJIT_NM_ORGAO_INTIMADO, TJIT_DOCU_DK, TJIT_SITUACAO_MGP, TJIT_DT_CARGA, TJIT_NM_ORGAO_CARGA, TJIT_IN_TIPO_PREVENTO, TJIT_IN_TIPO_PREV_POLICIAL, TJIT_ORGI_PREV_POLICIAL, TJIT_NM_ORGI_PREV_POLICIAL, TJIT_CD_DESTINATARIO, TJIT_NM_DESTINATARIO, TJIT_ORGI_DK_CAIXA_COLETIVA, TJIT_CD_PROCESSO_ORIGINARIO, TJIT_ORIGEM_INTIMACAO, TJIT_DT_ULT_REDISTR_ORGAO, TJIT_IN_TEM_3_INTERESSADO, TJIT_IN_1A_VISTA_MPRJ, TJIT_DIGITO_FINAL_DA_PK, TJIT_DIGITO_FINAL_PROCESSO, TJIT_DIG_FINAL_PROC_SEM_ZERO, TJIT_ORGE_ORGA_DK, TJIT_TJRA_DK, TJIT_QT_TAGS, TJIT_IN_ULT_STAT_REU_PRESO, TJIT_DT_ULT_STAT_REU_PRESO) AS 
  SELECT
         avc.avci_cd_processo_cnj AS TJIT_NR_PROCESSO,               /* 001 */
            avc.avci_cd_processo_cnj_sformato AS TJIT_NR_PROCESSO_SF, /* 002 */
            avc.avci_nr_instancia_proc AS TJIT_INSTANCIA,            /* 003 */
            avc.avci_cd_id_aviso AS TJIT_CD_ID_AVISO,                /* 004 */
            AVC.AVCI_DK AS TJIT_AVCI_DK,                             /* 005 */
            avc.avci_cd_processo_unico AS TJIT_CD_PROCESSO_UNICO,    /* 006 */
            CASE
            WHEN avc.avci_teip_dk IN (9)
               THEN
                  'PENDENTE'
            WHEN avc.avci_teip_dk IN (5, 6)
               THEN
                  NVL (
                     (SELECT   SUBSTR (
                                  MAX(TO_CHAR (penul.acos_dk,
                                               RPAD ('0', 13, '0'))
                                      || eipul.teip_nm_estado_intimacao),
                                  15
                               )
                        FROM      tjrj.tjrj_aviso_comunic_status penul
                               INNER JOIN
                                  tjrj.tjrj_estado_intimacao_portal eipul
                               ON eipul.teip_dk = penul.acos_teip_dk
                       WHERE       penul.acos_avci_dk = avc.avci_dk
                               AND penul.acos_in_ultimo_status = 'N'
                               AND penul.acos_teip_dk NOT IN (5, 6, 9)),
                     'PENDENTE'
                  )
               WHEN avc.avci_teip_dk NOT IN (1, 2, 3)
               THEN
                  eip.teip_nm_estado_intimacao
               WHEN AVC.AVCI_DT_RESPONDIDA_INTEGRA IS NOT NULL
               THEN
                  'RESPONDIDA'
               WHEN avc.avci_teip_dk = 1                         /* pendente*/
                                        AND AVC.AVCI_DT_ABERTURA_AVISO_INTEGRA IS NOT NULL
               THEN
                  'RECEBIDA'
               ELSE
                  eip.teip_nm_estado_intimacao
            END
               AS TJIT_ULTIMO_STATUS,                                /* 007 */
            avc.avci_dt_disponib_intimacao AS TJIT_DT_EXPEDICAO,     /* 008 */
            NVL (avc.avci_dt_abertura_aviso,
                 avc.avci_dt_abertura_aviso_integra)
               AS TJIT_DT_ABERTURA_AVISO,                            /* 009 */
            AVC.AVCI_ORGI_DK AS TJIT_ORGI_DK_DISTRIBUICAO,           /* 010 */
            oo.orgi_nm_orgao AS TJIT_NM_ORGAO_DISTRIBUIDO,           /* 011 */
            oo.orgi_nm_orgao_abrev AS TJIT_NM_ORGAO_DISTRIB_ABREV,   /* 012 */
            tpo.tpor_ds_tp_orgao AS TJIT_TP_ORGAO,                   /* 013 */
            avc.AVCI_CDMATRICULA_MEMBRO AS TJIT_CD_MATRICULA_DISTRIBUICAO, /* 014 */
            f.nmfuncionario AS TJIT_NM_MEMBRO_RESPONSAVEL,           /* 015 */
            avc.avci_cd_mat_abertura_aviso AS TJIT_CD_MATRICULA_ABERTURA, /* 016 */
            /*f1.nmfuncionario AS TJIT_NM_MEMBRO_ABERTURA_AVISO, */
            /* 017 */
            CASE
               WHEN avc.avci_cd_mat_abertura_aviso IS NULL
               THEN
                  NULL
               WHEN avc.avci_cdmatricula_membro =
                       avc.avci_cd_mat_abertura_aviso
               THEN
                  f.nmfuncionario
               ELSE
                  (SELECT   f1.nmfuncionario
                     FROM   rh_vw_funcionario f1
                    WHERE   f1.cdmatricula = avc.avci_cd_mat_abertura_aviso
                            AND f1.cdsituacaofunc = '1')
            END
               AS TJIT_NM_MEMBRO_ABERTURA_AVISO,
            /*clas.cldc_dk*/
            AVC.AVCI_CLDC_DK AS TJIT_CLASSE_DK,                      /* 018 */
            clas.cldc_ds_classe AS TJIT_DS_CLASSE_PROCESSO,           /* 019*/
            ccia.CCIA_CD_COMPETENCIA AS TJIT_COMPETENCIA_DK,         /* 020 */
            ccia.CCIA_NM_COMPETENCIA AS TJIT_NM_COMPETENCIA,         /* 021 */
            avc.avci_in_reu_preso AS TJIT_IN_REU_PRESO,              /* 022 */
            CASE
			   when PRAV.TJRA_IN_SIGILOSO IS NOT NULL then PRAV.TJRA_IN_SIGILOSO 
               WHEN (SELECT   SUBSTR (
                                 MAX(AVC1.AVCI_CD_ID_AVISO
                                     || TRIM (TO_CHAR (AVC1.AVCI_TEIP_DK))),
                                 16
                              )
                       FROM   tjrj.tjrj_aviso_comunic_intimacao avc1
                      WHERE   1 = 1 AND AVC1.AVCI_TEIP_DK NOT IN (7) /* cancelada */
                                                                    AND AVC1.AVCI_TEIP_DK IS NOT NULL
                              AND avc1.avci_nr_instancia_proc =
                                    avc.avci_nr_instancia_proc
                              AND avc1.avci_cd_processo_cnj =
                                    avc.avci_cd_processo_cnj) = '9' /* SIGILOSO */
               THEN
                  'S'
               ELSE
                  'N'
            END
               AS TJIT_IN_SIGILOSO,                                  /* 023 */
            avc.avci_in_idoso AS TJIT_IN_IDOSO,                      /* 024 */
            avc.avci_in_doenca_grave AS TJIT_IN_DOENCA_GRAVE,        /* 025 */
            avc.avci_in_intervencao_mp AS TJIT_IN_PRECISA_INTERVENCAO_MP, /* 026 */
            CASE WHEN avc.avci_teip_dk = 5 THEN 'S' ELSE 'N' END
               AS TJIT_IN_INCORRETO,                                 /* 027 */
            CASE
               WHEN avc.avci_teip_dk = 5
               THEN
                  (SELECT   MAX (ACS.ACOS_MENSAGEM_MNI)
                     FROM   tjrj.tjrj_aviso_comunic_status acs
                    WHERE   acs.acos_avci_dk = avc.avci_dk
                            AND acs.acos_in_ultimo_status = 'S')
               ELSE
                  NULL
            END
               AS TJIT_TX_MOTIVO_INCORRRETO,                         /* 028 */
            CASE
               WHEN TPO.TPOR_CD_TP_ORGAO IN ('PRO')
               THEN
                  'PROMOTORIA'
               WHEN TPO.TPOR_CD_TP_ORGAO IN ('PRC')
               THEN
                  'PROCURADORIA'
               WHEN     AOPE.TJAO_CD_INSTANCIA_PROC_ELETR = '2'
                    AND AOPE.TJAO_CD_PAPEL_PROC_ELETR = 'E'
                    AND AOPE.TJAO_CD_ASSESSORIA_CAO = 'C'
               THEN
                  'PROCURADORIA'
               WHEN     AOPE.TJAO_CD_INSTANCIA_PROC_ELETR = '2'
                    AND AOPE.TJAO_CD_PAPEL_PROC_ELETR = 'E'
                    AND AOPE.TJAO_CD_ASSESSORIA_CAO = 'A'
               THEN
                  'ASSESSORIA'
               ELSE
                  NULL
            END
               AS TJIT_ORGAO_EXECUCAO,                               /* 029 */
            NVL (TJRA_CD_NIVEL_SIGILO_PROC, '0') AS TJIT_NIVEL_SIGILO, /* 030 */
            AVC.AVCI_ORGI_DK AS TJIT_ORGI_DK_ULT,                    /* 031 */
            CASE WHEN avc.avci_teip_dk = 9 
                                          THEN 1
                                                ELSE avc.avci_teip_dk END /* avc.avci_teip_dk */
                                                                         AS TJIT_TEIP_DK_ULT, /* 032 */
            CASE
               WHEN avc.avci_in_parecer_ciencia_tjrj = 'C'
               THEN
                  'CIENCIA_TJRJ'
               WHEN avc.avci_in_parecer_ciencia_tjrj = 'P'
               THEN
                  'PARECER_TJRJ'
               WHEN avc.avci_in_parecer_ciencia_tjrj IS NULL
               THEN
                  'NAO INFORMADO'
            END
               AS TJIT_DS_MANIFESTACAO,                               /* 033*/
            avc.avci_dt_peticao_anterior_ni AS TJIT_DT_PET_ANTERIOR_NI, /* 034*/
            NVL (oe.orge_nm_orgao, avc.avci_nm_orgao_julgador)
               AS TJIT_NM_ORGAO_ORIGEM,                               /* 034*/
            CASE
               WHEN NVL (AVC.AVCI_IN_PETICIONADO, 'N') = 'N'
               THEN
                  NVL (AVC.AVCI_MATE_DK_ORIGINARIO, AVC.AVCI_MATE_DK)
               ELSE
                  NVL (AVC.AVCI_MATE_DK, AVC.AVCI_MATE_DK_ORIGINARIO)
            END
               AS TJIT_MATE_DK,                                      /* 036 */
            avc.avci_dt_pesquisa AS TJIT_DT_ULTIMA_ATUALIZACAO_MNI,  /* 037 */
            avc.avci_nm_destinatario AS TJIT_NM_ORGAO_INTIMADO,      /* 038 */
            avc.avci_docu_dk AS TJIT_DOCU_DK,                        /* 039 */
            TSD.TPST_DS_TP_SITUACAO AS TJIT_SITUACAO_MGP,            /* 040 */
            D.DOCU_DT_CARGA AS TJIT_DT_CARGA,                        /* 041 */
            OOCARGA.ORGI_NM_ORGAO AS TJIT_NM_ORGAO_CARGA,            /* 042 */
            NULL AS TJIT_IN_TIPO_PREVENTO,                           /* 043 */
            CASE
               WHEN TPI.PINQ_IN_ORIGEM_POLICIAL = 'S' THEN '1'  /* policial */
               WHEN TPI.PINQ_IN_ORIGEM_POLICIAL = 'N' THEN '2'    /* manual */
               ELSE NULL
            END
               AS TJIT_IN_TIPO_PREV_POLICIAL,                        /* 044 */
            tpi.PINQ_ORGI_DK AS TJIT_ORGI_PREV_POLICIAL,             /* 045 */
            org_prev_polic.ORGI_NM_ORGAO AS TJIT_NM_ORGI_PREV_POLICIAL, /* 046 */
            avc.avci_cd_destinatario AS TJIT_CD_DESTINATARIO,        /* 047 */
            avc.avci_nm_destinatario AS TJIT_NM_DESTINATARIO,        /* 048 */
            CASE
               WHEN avc.avci_oint_dk = 2 OR avc.avci_teip_dk IN (7, 8)
               THEN
                  NULL
               ELSE
                  (SELECT   TO_NUMBER(SUBSTR (
                                         MAX(TO_CHAR (ACD.AVCD_DT_INCLUSAO,
                                                      'yyyymmddhh24miss')
                                             || TO_CHAR (acd.avcd_orgi_dk)),
                                         15
                                      ))
                     /* pode ter sido redistribuido para várias caixas coletivas, pego a última */
                     FROM      tjrj.tjrj_aviso_comunic_intimacao avc3
                            INNER JOIN
                               tjrj.tjrj_aviso_comunic_distrib acd
                            ON acd.avcd_avci_dk = avc3.avci_dk
                    /* INNER JOIN orgi.orgi_orgao oo ON oo.orgi_dk = acd.avcd_orgi_dk */
                    WHERE   1 = 1
                            AND acd.avcd_orgi_dk IN
                                     (30145800, 30145793, 30145934)
                            AND avc3.avci_dk = avc.avci_dk)
            END
               AS TJIT_ORGI_DK_CAIXA_COLETIVA,                       /* 049 */
            AVCI_CD_PROCESSO_ORIGINARIO AS TJIT_CD_PROCESSO_ORIGINARIO, /* 050 */
            orig.oint_ds_origem AS tjit_origem_intimacao,            /* 051 */
            avc.AVCI_DT_ULT_REDISTR_ORGAO AS TJIT_DT_ULT_REDISTR_ORGAO, /* 052 */
            CASE
               WHEN (avc.avci_oint_dk = 2
                     AND NVL (avc.AVCI_QT_TERCEIRO_INTERESSADO, 0) = 1)
               THEN
                  'S'
               ELSE
                  'N'
            END
               AS TJIT_IN_TEM_3_INTERESSADO,                         /* 053 */
            NVL (avc.AVCI_IN_1A_VISTA_MPRJ, 'N')	AS TJIT_IN_1A_VISTA_MPRJ, 			/* 054 */
            avc.avci_digito_final_da_pk 			AS tjit_digito_final_da_pk,   		/* 055*/
            avc.avci_digito_final_processo 			AS tjit_digito_final_processo, 		/* 056 */
            avc.avci_dig_final_proc_sem_zero 		AS tjit_dig_final_proc_sem_zero,	/* 057 */
            avc.avci_orge_orga_dk 					AS tjit_orge_orga_dk ,              /* 058 */
            PRAV.TJRA_DK							AS TJIT_TJRA_DK ,					/* 059 */
            nvl(AVC.AVCI_QT_TAGS, 0) + nvl(PRAV.TJRA_QT_TAGS, 0) AS TJIT_QT_TAGS , 		/* 060 */
			PRAV.TJRA_IN_ULT_STAT_REU_PRESO			AS TJIT_IN_ULT_STAT_REU_PRESO, 		/* 061 */
			PRAV.TJRA_DT_ULT_STAT_REU_PRESO			AS TJIT_DT_ULT_STAT_REU_PRESO 		/* 062 */
     FROM                                                   tjrj.tjrj_aviso_comunic_intimacao avc
                                                         INNER JOIN
                                                            tjrj.tjrj_estado_intimacao_portal eip
                                                         ON eip.teip_dk =
                                                               avc.avci_teip_dk
                                                      INNER JOIN
                                                         orgi.orgi_orgao oo
                                                      ON oo.orgi_dk =
                                                            AVC.AVCI_ORGI_DK
                                                   INNER JOIN
                                                      orgi.orgi_tp_orgao tpo
                                                   ON tpo.tpor_dk =
                                                         oo.orgi_tpor_dk
                                                INNER JOIN
                                                   tjrj.tjrj_origem_intimacao orig
                                                ON orig.oint_dk =
                                                      avc.avci_oint_dk
                                             INNER JOIN
                                                TJRJ.TJRJ_COMPETENCIA ccia
                                             ON ccia.CCIA_CD_COMPETENCIA =
                                                   TO_NUMBER(avc.AVCI_NR_COMPETENCIA_PROC)
                                          LEFT JOIN
                                             rh_vw_funcionario f
                                          ON f.cdmatricula =
                                                avc.AVCI_CDMATRICULA_MEMBRO
                                             AND f.cdsituacaofunc = '1'
                                       LEFT JOIN
                                          mcpr.mcpr_classe_docto_mp clas
                                       ON              /*clas.cldc_cd_classe*/
                                         CLAS.CLDC_DK = AVC.AVCI_CLDC_DK /*avc.avci_cd_classe_tj */
                                    LEFT JOIN
                                       TJRJ.TJRJ_ATIVID_ORG_PROC_ELETR aope
                                    ON AOPE.TJAO_ORGI_DK = AVC.AVCI_ORGI_DK
                                 LEFT JOIN
                                    mprj.mprj_orgao_ext oe
                                 ON oe.orge_orga_dk = avc.avci_orge_orga_dk
                              LEFT JOIN
                                 mcpr_documento d
                              ON d.docu_dk = AVC.AVCI_DOCU_DK
                           LEFT JOIN
                              MCPR.MCPR_TP_SITUACAO_DOCUMENTO tsd
                           ON TSD.TPST_DK = D.DOCU_TPST_DK
                        LEFT JOIN
                           orgi_orgao oocarga
                        ON OOCARGA.ORGI_DK = D.DOCU_ORGI_ORGA_DK_CARGA
                     LEFT JOIN
                        mcpr_vista v
                     ON V.VIST_DK = D.DOCU_VIST_DK_ABERTA
                  LEFT JOIN
                     TJRJ.TJRJ_PREVENTO_INQUERITO tpi
                  ON TPI.PINQ_CD_PROCESSO_CNJ = AVC.AVCI_CD_PROCESSO_CNJ 
                     AND CASE
                           WHEN PINQ_DT_FIM IS NULL THEN 0
                           ELSE PINQ_DK
                        END = 0
               LEFT JOIN
                  ORGI.ORGI_ORGAO org_prev_polic
               ON tpi.PINQ_ORGI_DK = org_prev_polic.ORGI_DK
            LEFT JOIN
               TJRJ.TJRJ_PROCESSO_AVISO PRAV
            ON PRAV.TJRA_DK = AVC.AVCI_TJRA_DK
    WHERE   1 = 1
            AND (TJAO_DT_INICIO_VISUALIZA_AVISO IS NULL
                 OR AVC.AVCI_DT_DISPONIB_INTIMACAO >=
                      TJAO_DT_INICIO_VISUALIZA_AVISO)
            AND ( (NVL (AOPE.TJAO_TJTC_DK, 0) NOT IN (2))
                 OR (AOPE.TJAO_TJTC_DK IN (2)
                     AND TRUNC(AVC.AVCI_DT_DISPONIB_INTIMACAO) + 1 + (9 / 24) <
                           SYSDATE));
