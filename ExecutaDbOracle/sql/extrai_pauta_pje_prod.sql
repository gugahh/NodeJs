DECLARE 
	w_retorno	VARCHAR2(2000); 
BEGIN
	TJRJ.TJRJ_PA_PAUTA.pr_extrai_sessoes_eproc
	(
		p_recuo			=>	5		,
		p_msg_retorno	=>	w_retorno
	);
	dbms_output.put_line(w_retorno); 
EXCEPTION 
      WHEN OTHERS THEN 
	dbms_output.put_line('ERRO inesperado: ' || SQLERRM); 
END; 

