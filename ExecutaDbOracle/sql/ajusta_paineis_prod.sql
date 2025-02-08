DECLARE 
	w_retorno	VARCHAR2(2000); 
BEGIN
	TJRJ.TJRJ_PA_PAINEL_INFO.prc_upd_paineis(p_msg_retorno => w_retorno); 
	dbms_output.put_line(w_retorno); 
EXCEPTION 
      WHEN OTHERS THEN 
	dbms_output.put_line('ERRO inesperado: ' || SQLERRM); 
END; 

