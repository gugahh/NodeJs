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
		VWAT_TIPO_ASSOCIACAO 	ASC	,
		VWAT_ORDENACAO 			ASC	
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
