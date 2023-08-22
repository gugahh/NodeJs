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
		WHERE tag.TACU_ORGI_DK = avc.AVCI_ORGI_DK 
		
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

CREATE OR REPLACE VIEW TJRJ.TJRJ_VW_AVISO_PROCESSO (TVAP_AVCI_DK, TVAP_CD_ID_AVISO, TVAP_NR_INSTANCIA_PROC, TVAP_CD_PROCESSO_CNJ, TVAP_CD_ORGAO_JULGADOR, TVAP_NM_ORGAO_JULGADOR, TVAP_DS_CLASSE, TVAP_CLASSE_COMPLETA, TVAP_CLDC_DK, TVAP_CD_PROCESSO_TJ, TVAP_CD_PROCESSO_UNICO, TVAP_ORIGEM_INTIMACAO, TVAP_NM_COMPETENCIA, TVAP_TJRA_DK) AS 
  SELECT 
            avc.avci_dk AS tvap_avci_dk,
            avc.avci_cd_id_aviso AS tvap_cd_id_aviso,
            avc.avci_nr_instancia_proc AS tvap_nr_instancia_proc,
            avc.avci_cd_processo_cnj AS tvap_cd_processo_cnj,
            avc.avci_cd_orgao_julgador AS tvap_cd_orgao_julgador,
            avc.avci_nm_orgao_julgador AS tvap_nm_orgao_julgador,
            clas.tjcl_ds_classe AS tvap_ds_classe,
            (    SELECT   REVERSE(SYS_CONNECT_BY_PATH (
                                     REVERSE (cd.cldc_ds_classe),
                                     '#'
                                  ))
                   FROM   mcpr_classe_docto_mp cd
                  WHERE   CONNECT_BY_ISLEAF = 1
             START WITH   cd.cldc_dk = avc.avci_cldc_dk
             CONNECT BY   PRIOR cd.cldc_cldc_dk_superior = cd.cldc_dk)
               AS tvap_classe_completa,
            avc.avci_cldc_dk AS tvap_cldc_dk,
            avc.avci_cd_processo_tj AS tvap_cd_processo_tj,
            avc.avci_cd_processo_unico AS tvap_cd_processo_unico,
            orig.oint_ds_origem AS tvap_origem_intimacao,
            COMPE.CCIA_NM_COMPETENCIA as tvap_nm_competencia,
            avc.AVCI_TJRA_DK			AS TVAP_TJRA_DK
     FROM         tjrj.tjrj_aviso_comunic_intimacao avc
               LEFT JOIN
                  tjrj.tjrj_classe clas
               ON clas.tjcl_cd_classe = avc.avci_cd_classe_tj
            INNER JOIN
               tjrj.tjrj_origem_intimacao orig
            ON orig.oint_dk = avc.avci_oint_dk
            left join TJRJ.TJRJ_COMPETENCIA compe on COMPE.CCIA_CD_COMPETENCIA =to_number(AVC.AVCI_NR_COMPETENCIA_PROC)
    WHERE   1 = 1;

COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_PROCESSO.TVAP_TJRA_DK IS 'FK para a tabela processo_aviso.';