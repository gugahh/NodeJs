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
	VWAT_NM_COR_TAG			,
	VWAT_DT_ASSOC_TAG
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
	VWAT_NM_COR_TAG 		,
	VWAT_DT_ASSOC_TAG
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
			tag.TACU_NM_COR_TAG				AS VWAT_NM_COR_TAG			,
			tgav.TAAV_DT_INCLUSAO			AS VWAT_DT_ASSOC_TAG
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
			tag.TACU_NM_COR_TAG				AS VWAT_NM_COR_TAG			,
			tapr.TGPR_DT_INCLUSAO 			AS VWAT_DT_ASSOC_TAG		
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
COMMENT ON COLUMN TJRJ.TJRJ_VW_AVISO_TAG.VWAT_DT_ASSOC_TAG IS 'Data da associação da Tag ao Aviso ou ao Processo.';

CREATE OR REPLACE VIEW TJRJ.TJRJ_VW_METADADOS_PECAS_DCP (VMPD_NR_PROCESSO_CNJ, VMPD_MTPP_DK, VMPD_ID_DOCUMENTO_TJRJ, VMPD_DT_DOCUMENTO, VMPD_DS_DOCUMENTO, VMPD_NR_FOLHA_VIRTUAL, VMPD_NR_PROTOCOLO_PETICAO, VMPD_IN_SIGILO, VMPD_IN_DOC_ORIGEM_MP, VMPD_ID_DOC_PAI, VMPD_CD_IDENTIFICADOR_MNI, VMPD_ID_DOC_VINCULADO, VMPD_DT_DISPONIB_AVISO, VMPD_DT_ABERTURA_AVISO, VMPD_DT_INCLUSAO, VMPD_NM_PASTA, VMPD_NM_VOLUME, VMPD_CD_TP_DOC_LOCAL, VMPD_DS_TP_DOC_LOCAL, VMPD_CD_TP_DOCUMENTO, VMPD_DT_DOWNLOAD, VMPD_DT_INDEXACAO, VMPD_DS_MIMETYPE, VMPD_TX_MENSAGEM_DOWNLOAD, VMPD_NR_BYTES_PDF, VMPD_NR_PAG_PDF, VMPD_IN_PECA_EXCLUIDA) AS 
  SELECT DISTINCT 
		meta.mtpp_nr_processo_cnj 			AS vmpd_nr_processo_cnj		, 
		meta.mtpp_dk						AS vmpd_mtpp_dk				, 
		meta.mtpp_id_documento 				AS vmpd_id_documento_tjrj	, 
		meta.mtpp_dt_documento 				AS vmpd_dt_documento		, 
		meta.mtpp_ds_descricao_documento 	AS vmpd_ds_documento		, 
		meta.mtpp_nr_folha_virtual 			AS vmpd_nr_folha_virtual	, 
		
		meta.mtpp_nr_protocolo_peticao		AS vmpd_nr_protocolo_peticao ,  
		
		CASE meta.mtpp_in_sigilo
			WHEN '1' THEN 'S'
			ELSE 'N'
		END AS vmpd_in_sigilo , 
		
		CASE 
		    WHEN mpas.mspa_dk IS NOT NULL THEN 'S' 
		    ELSE 'N' 
		END AS vmpd_in_doc_origem_mp ,
		
		meta.mtpp_id_doc_pai 				      AS vmpd_id_doc_pai		,
		meta.mtpp_cd_identificador_aviso 	AS vmpd_cd_identificador_mni 	,
		meta.mtpp_id_doc_vinculado			  AS vmpd_id_doc_vinculado		,
		meta.mtpp_dt_disponib_aviso 		  AS vmpd_dt_disponib_aviso		,
		meta.mtpp_dt_abertura_aviso 		  AS vmpd_dt_abertura_aviso		,
		meta.mtpp_dt_inclusao 				    AS vmpd_dt_inclusao			,
		meta.mtpp_nm_pasta 					      AS vmpd_nm_pasta 			,
		meta.mtpp_nm_volume 				      AS vmpd_nm_volume 		,
		meta.mtpp_cd_tp_doc_local 			  AS vmpd_cd_tp_doc_local 		,
		tp.ttdl_ds_tp_doc_local 			    AS vmpd_ds_tp_doc_local		,
		meta.mtpp_cd_tp_documento 			  AS vmpd_cd_tp_documento		,
		meta.mtpp_dt_download 				    AS vmpd_dt_download			,
		meta.mtpp_dt_indexacao 				    AS vmpd_dt_indexacao 		,
		'application/pdf' 					      AS vmpd_ds_mimetype 		,
		meta.mtpp_tx_mensagem_download 		AS vmpd_tx_mensagem_download	,
		meta.mtpp_nr_pag_pdf				      AS vmpd_nr_pag_pdf		,
		meta.mtpp_nr_bytes_pdf 				    AS vmpd_nr_bytes_pdf		,
		
		CASE 
			WHEN meta.mtpa_dt_exclusao_peca IS NOT NULL THEN 'S'
			ELSE 'N'
		END
		AS vmpd_in_peca_excluida				
		
	FROM tjrj_metadados_pecas_processo meta
		right JOIN	tjrj_tp_documento_local_mni tp ON meta.mtpp_ttdl_dk = tp.ttdl_dk
		left JOIN	tjrj.tjrj_metadados_pecas_assinat mpas ON mpas.mspa_mtpp_dk = meta.mtpp_dk
		WHERE 1=1
      ;

COMMENT ON COLUMN TJRJ.TJRJ_VW_METADADOS_PECAS_DCP.VMPD_ID_DOCUMENTO_TJRJ IS 'Número identificador do documento, na base do TJRJ.';

GRANT SELECT ON TJRJ.TJRJ_VW_METADADOS_PECAS_DCP TO RL_INTG_JUDI;
GRANT SELECT ON TJRJ.TJRJ_VW_METADADOS_PECAS_DCP TO RL_TJRJ_WEBSERV;
