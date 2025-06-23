DECLARE
	w_msg_retorno	varchar2(2000);	-- Mensagem OUT
	w_recuo_antigos	NUMBER;			-- Usado para dar rescaldo em peticoes bem antigas, especialmente de madrugada.
	w_horario_atual	NUMBER;
BEGIN 
	
	-- Recuo peticoes antigas: Caso a hora seja entre 00:00 e 06:00  --> recua 90 dias;
	-- demais horarios: 40 dias.
	w_recuo_antigos := CASE WHEN TO_NUMBER(to_char(sysdate, 'HH24')) <= 6 THEN 90 ELSE 40 END;
	
	-- 4 em 4 horas: 
	-- 00:00 / 04:00 / 8:00 / 12:00 / 16:00 / 20:00 
	
 	-- 1. Gerando as guias de Saida - via recuo 
	dbms_output.put_line(chr(13) || '> 1. Processando peticionamentos antigos');
	TJRJ.TJRJ_PA_INTEGRACAO_MGP.pr_saida_pet_eproc2g 
	(
		p_recuo 		=> w_recuo_antigos 		,
		p_processo		=> NULL					,
		p_msg_retorno	=> w_msg_retorno
	);
	dbms_output.put_line(chr(13) || w_msg_retorno);
	
 	dbms_output.put_line(chr(13) || '> 2. Processando guias de entrada - ultimos 7 dias - apenas as 22h');
 	
	-- 2. Guias de Entrada.
	w_horario_atual := to_number(to_char(sysdate, 'HH24'));
 	IF (w_horario_atual >= 22) THEN 
		TJRJ.TJRJ_PA_INTEGRACAO_MGP.PR_INTEGR_EPROC_2I_LOTE  
		(
			p_recuo 		=> 7 		,
			p_avci_dk		=> null		,			-- aviso que se deseja integrar. Opcional.
			p_msg_retorno	=> w_msg_retorno		-- Em caso de erro, contera a mensagem de erro.
		);
		dbms_output.put_line(chr(13) || '2.1 - ' || w_msg_retorno);
	
	 	-- 3. Gerando (novamente) as guias de Saida - via recuo 
		-- So eh necessario caso sejam geradas guias de entrada.
	 	dbms_output.put_line(chr(13) || '> 2.2. Processando guias de saida - ultimos 7 dias');
		TJRJ.TJRJ_PA_INTEGRACAO_MGP.pr_saida_pet_eproc2g 
		(
			p_recuo 		=> 7 		,
			p_processo		=> NULL		,
			p_msg_retorno	=> w_msg_retorno
		);
		dbms_output.put_line(chr(13) || w_msg_retorno);
 	ELSE 
	 	dbms_output.put_line(chr(13) || '> 2.1 nao foram geradas guias de entrada - serao geradas apenas apos as 22h.');
 	END IF;
END;
