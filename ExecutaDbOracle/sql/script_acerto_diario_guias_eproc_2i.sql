DECLARE
	w_msg_retorno	varchar2(2000);	
BEGIN 
	
	TJRJ.TJRJ_PA_INTEGRACAO_MGP.pr_batch_guias_eproc2i
	(
		p_msg_retorno	=> w_msg_retorno
	);
	dbms_output.put_line(w_msg_retorno);

END;
