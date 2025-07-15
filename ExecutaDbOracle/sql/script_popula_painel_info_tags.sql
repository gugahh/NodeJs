-- SELECT * FROM TJRJ_VW_PAINEL_INFO_TAG t ;

DECLARE 

	-- Obtem os orgaos a terem os seus paineis atualizados
	CURSOR C1 
	IS 
		SELECT 		
			OO.ORGI_DK 			AS ORGI_DK	, 
			oo.orgi_nm_orgao 	AS NM_ORGAO 
		FROM ORGI.ORGI_ORGAO oo	
			INNER JOIN TJRJ.TJRJ_ATIVID_ORG_PROC_ELETR aope ON AOPE.TJAO_ORGI_DK = OO.ORGI_DK
		WHERE 1=1
		;
	
	-- Query Totalizacoes por Tag, orgao e instancia.
	-- Note que sao usadas 3 totalizacoes, pois existem associacoes:
	-- * Entre Tag e Aviso, diretamente
	-- * Entre Tag e Processo, ou 
	-- * Entre tag, via processo E aviso, simultaneamente.
	CURSOR CUR_TAGS_P_ORGAO (p_orgi_dk IN NUMBER)
	IS 
		SELECT  
			avc.avci_orgi_dk				AS ORGI_DK 		,
			avc.AVCI_NR_INSTANCIA_PROC	 	AS INSTANCIA 	,
			tacu.TACU_DK								,
			tacu.TACU_DS_TAG							,
			tpif.TPIF_DK								, 
			pita.PITA_DK								, 
			SUM( CASE WHEN (tp.TGPR_TJRA_DK IS NOT NULL AND TA.TAAV_AVCI_DK IS NULL) THEN 1 ELSE 0 END ) AS QT_ASSOC_PROC_APENAS	,
			SUM( CASE WHEN (tp.TGPR_TJRA_DK IS NULL AND TA.TAAV_AVCI_DK IS NOT NULL) THEN 1 ELSE 0 END ) AS QT_ASSOC_AVISO_APENAS	,
			SUM( CASE WHEN (tp.TGPR_TJRA_DK IS NOT NULL AND TA.TAAV_AVCI_DK IS NOT NULL) THEN 1 ELSE 0 END ) AS QT_ASSOC_AMBOS 		,
			COUNT(1) AS QT_TOTAL
		FROM tjrj.TJRJ_TAG_CUSTOMIZADA TACU 
			INNER JOIN ORGI.ORGI_ORGAO oo ON oo.orgi_dk = tacu.TACU_ORGI_DK
			INNER JOIN TJRJ.TJRJ_AVISO_COMUNIC_INTIMACAO avc ON AVC.AVCI_ORGI_DK = tacu.TACU_ORGI_DK
			LEFT JOIN TJRJ.TJRJ_ATIVID_ORG_PROC_ELETR aope ON AOPE.TJAO_ORGI_DK = avc.AVCI_ORGI_DK
			
			-- Left Join com o painel informativo de tag. Ha apenas 1 por orgao / Instancia. 
			LEFT JOIN TJRJ.TJRJ_PAINEL_INFORMATIVO tpif 
				ON tpif.TPIF_ORGI_DK = oo.orgi_dk
				AND tpif.TPIF_NR_INSTANCIA = avc.AVCI_NR_INSTANCIA_PROC
				
			-- Left Join com o painel da Tag.
			-- Sera util, no reprocessamento, para poupar buscas a um painel ja criado; So ha um por Tag / Orgao / Instancia. 
			LEFT JOIN TJRJ.TJRJ_PAINEL_INFO_TAG pita 
				ON pita.PITA_TPIF_DK = tpif.TPIF_DK
				AND pita.PITA_TACU_DK = tacu.TACU_DK 
			
			-- relacionamento da tag com o Processo (pode existir ou nao)
			LEFT JOIN tjrj.TJRJ_TAG_PROCESSO_AVISO tp 
				ON TACU.TACU_DK = tp.TGPR_TACU_DK
				AND tp.TGPR_TJRA_DK = avc.AVCI_TJRA_DK
			-- relacionamento da tag com o aviso (pode existir ou nao)
			LEFT JOIN tjrj.TJRJ_TAG_AVISO TA
				ON	TACU.TACU_DK = TA.TAAV_TACU_DK
				AND	TA.TAAV_AVCI_DK = avc.AVCI_DK
		WHERE 1=1
			AND avc.AVCI_NM_ULTIMO_STATUS IN ('PENDENTE', 'RECEBIDA', 'RECEBIDA_TACITA')
			and avc.AVCI_TEIP_DK not in (5, 7) 
			AND avc.AVCI_CD_ID_AVISO_CANCELADO IS NULL 
			AND avc.AVCI_ORGI_DK IS NOT NULL 
			AND avc.AVCI_ORGI_DK IN ( p_orgi_dk )
			-- AND oo.ORGI_DK = 100696	-- 1ª PROCURADORIA DE JUSTIÇA JUNTO À 1ª CÂMARA CRIMINAL DO TRIBUNAL DE JUSTIÇA DO ESTADO DO RIO DE JANEIRO
			-- Ignorar avisos anteriores a data de inicio de visualizacao
			AND ( TJAO_DT_INICIO_VISUALIZA_AVISO IS NULL OR avc.AVCI_DT_DISPONIB_INTIMACAO >= TJAO_DT_INICIO_VISUALIZA_AVISO )
			AND 
			(
				-- a Tag esta associada ao aviso de alguma forma
				TA.TAAV_AVCI_DK IS NOT NULL OR 
				tp.TGPR_TJRA_DK IS NOT NULL
			)
			AND 
			( (AOPE.TJAO_TJTC_DK is null OR AOPE.TJAO_TJTC_DK NOT IN (2))
				 OR (AOPE.TJAO_TJTC_DK IN (2)
					 AND TRUNC(avc.AVCI_DT_DISPONIB_INTIMACAO) + 1 + (9 / 24) <
						   SYSDATE)
			)
		GROUP BY 
			avc.avci_orgi_dk			,
			avc.AVCI_NR_INSTANCIA_PROC 	,
			tacu.TACU_DK				,
			tacu.TACU_DS_TAG			,
			tpif.TPIF_DK				, 	
			pita.PITA_DK				 	
		ORDER BY 
			avc.avci_orgi_dk			,
			avc.AVCI_NR_INSTANCIA_PROC 	,
			tacu.TACU_DS_TAG			,
			tacu.TACU_DK				
		;
			
	-- Variaveis 
	ROW_F CUR_TAGS_P_ORGAO%ROWTYPE;  
	
	idx			NUMBER := 0;	
	
	idx_tag		NUMBER := 0;	
	
	w_tpif_dk 	NUMBER;			
	
	w_id_painel_tag 	NUMBER;
	
	
	-- Zera todos os paineis de tags.
	PROCEDURE PRC_LIMPA_PAINEL_TAG IS 
	BEGIN 
		update	TJRJ.TJRJ_PAINEL_INFO_TAG pita 
		SET 	pita.PITA_QT_AVI_ASSOC_PROC		= 0	,
				pita.PITA_QT_AVI_ASSOC_AVISO	= 0	,
				pita.PITA_QT_AVI_ASSOC_AMBOS	= 0
		where	pita.PITA_QT_AVI_ASSOC_TOTAL > 0;	
		COMMIT;
	END PRC_LIMPA_PAINEL_TAG;
	
	-- Verifica e retorna a associacao entre um tag (tacu_dk) e um painel (orgao + instancia) (tpif_dk).
	-- Se nao existir o registro do painel de tags que associa a tag ao orgao + instancia, retorna nulo.
	FUNCTION fc_aux_obtem_pita_dk(p_tpif_dk in number, p_tacu_dk in number) 
		return NUMBER 
	IS 
			w_pita_dk 			NUMBER;
			w_quant_registro	NUMBER;
	BEGIN
		Select	min(PITA_DK), count(1)
		into 	w_pita_dk	, w_quant_registro
		From TJRJ.TJRJ_PAINEL_INFO_TAG pita
		where	pita.PITA_TPIF_DK 	= p_tpif_dk  
		and 	pita.PITA_TACU_DK 	= p_tacu_dk;

		return w_pita_dk;
	END fc_aux_obtem_pita_dk;
	

	-- Obtem (ou cria, se nessario) o Painel Informativo para uma tag, dado o Painel Informativo "pai", e a tag.
	-- Retorna: DK de TJRJ_PAINEL_INFO_TAG.
	function fc_obtem_painel_info_tag 
	(
		p_tpif_dk		in NUMBER		,
		p_tacu_dk		in NUMBER		, 
		p_avci_dk 		in NUMBER		
	)
	return NUMBER
	IS 
		PRAGMA AUTONOMOUS_TRANSACTION;
		
		w_pita_dk			NUMBER;
		w_quant_registro	NUMBER;
	begin 
		-- Existe o registro do painel de tag, para a tag / orgao + istancia fornecedidos??
		w_pita_dk := fc_aux_obtem_pita_dk(p_tpif_dk, p_tacu_dk);
		
		if (w_pita_dk is not null) then 
			return w_pita_dk;
		end if;
		
		-- Nao existe. Cadastrando.
		BEGIN
			SELECT TJRJ.TJRJ_SQ_PIQM_DK.NEXTVAL 
			INTO w_pita_dk 
			FROM DUAL;
					
			INSERT INTO TJRJ.TJRJ_PAINEL_INFO_TAG
			(	
				PITA_DK 				, 
				PITA_TPIF_DK 			, 
				PITA_TACU_DK 			, 
				PITA_QT_AVI_ASSOC_PROC 	, 
				PITA_QT_AVI_ASSOC_AVISO , 
				PITA_QT_AVI_ASSOC_AMBOS , 
				PITA_DT_INCLUSAO 		
			)
			VALUES 
			(
				w_pita_dk				,	
				p_tpif_dk				,	  
				p_tacu_dk				,	 
				0						,	 
				0						,	 
				0						,	 
				SYSDATE						  
			);
			COMMIT; -- Transacao autonoma 
			
		Exception
			When DUP_VAL_ON_INDEX then
				rollback;
				-- Ocorreu um erro de concorrencia. Eh esperado. Nao se deve incluir o novo registro
				-- de TJRJ_PAINEL_INFO_TAG, e deve retornar o PITA_DK criado pelo processo concorrente.
				w_pita_dk := fc_aux_obtem_pita_dk(p_tpif_dk, p_tacu_dk);
			When others then
				w_pita_dk := null;
				dbms_output.put_line(
					'Excessao nao prevista; ' || 
			    	'Params: p_tpif_dk: ' || to_char(p_tpif_dk) || 
					' - p_tacu_dk: '	|| to_char(p_tacu_dk) || 
					' - p_avci_dk: '	|| to_char(p_avci_dk) || 
					' - Erro: ' || sqlerrm  
				);
				ROLLBACK;
		END;
		return w_pita_dk;	 
	end fc_obtem_painel_info_tag;
	
BEGIN 
		dbms_output.put_line('>>> Iniciando procedimento.');  
		dbms_output.put_line('>> horario de Inicio: ' || to_char(SYSDATE, 'dd/mm/yyyy hh24:mi:ss'));  
		
		-- Limpa todos os paineis de tags.
		PRC_LIMPA_PAINEL_TAG;

		-- Popula as tags para todos os orgaos.
		<<principal>>
		FOR cc1 IN C1  
		LOOP
			
			idx := idx + 1;		 
			
			w_tpif_dk := NULL;
		
--			dbms_output.put_line(chr(13) || '(' || to_char(idx) 
--				|| ') orgi_dk: ' || to_char(cc1.ORGI_DK) 
--				|| ' - nm_orgao: ' || cc1.NM_ORGAO);
			
			-- TODO: Atualizacao, aqui.
			OPEN CUR_TAGS_P_ORGAO(cc1.ORGI_DK);
			
			<<loop_tags>>
			LOOP 
				FETCH CUR_TAGS_P_ORGAO INTO ROW_F;
				exit when CUR_TAGS_P_ORGAO%NOTFOUND;
				
				idx_tag := idx_tag + 1;
				
				w_id_painel_tag := NULL;
				w_tpif_dk 			:= ROW_F.TPIF_DK;	
				w_id_painel_tag		:= ROW_F.PITA_DK;
				
				IF (w_tpif_dk IS null) THEN 
					-- Ainda nao existe painel principal para esse orgao / instancia. Cadastrando;
					-- Ou obtendo de novo da base, caso ja cadastrado.
					w_tpif_dk := TJRJ.TJRJ_PA_PAINEL_INFO.fc_obtem_painel_info_aviso
						(
							p_orgi_dk 		=>  ROW_F.ORGI_DK		,
							p_instancia 	=>  ROW_F.INSTANCIA		,
							p_avci_dk 		=>  0
						);
				END IF; 
				
				IF (w_id_painel_tag IS NULL) THEN
					-- ainda nao existe painel informativo para essa tag / instancia / orgao de execucao
					w_id_painel_tag := fc_obtem_painel_info_tag 
						(
							p_tpif_dk		=> w_tpif_dk		,
							p_tacu_dk		=> ROW_F.TACU_DK	,
							p_avci_dk 		=> 0 			
						);
				END IF;
				
				UPDATE TJRJ.TJRJ_PAINEL_INFO_TAG pita  
				SET 	
						pita.PITA_QT_AVI_ASSOC_PROC		= ROW_F.QT_ASSOC_PROC_APENAS      ,
						pita.PITA_QT_AVI_ASSOC_AVISO	= ROW_F.QT_ASSOC_AVISO_APENAS     ,
						pita.PITA_QT_AVI_ASSOC_AMBOS	= ROW_F.QT_ASSOC_AMBOS
				WHERE	pita.PITA_DK = w_id_painel_tag ;
			
			end loop;	
			CLOSE CUR_TAGS_P_ORGAO;
			
		END LOOP;	
		COMMIT ;
		
		dbms_output.put_line('Finalizado com Sucesso.');	
		dbms_output.put_line('>> horario de Termino: ' || to_char(SYSDATE, 'dd/mm/yyyy hh24:mi:ss'));
			
EXCEPTION	
	WHEN OTHERS THEN
		ROLLBACK;
		dbms_output.put_line('ERRO em prc_upd_paineis. Erro: ' || sqlerrm);
END; 
