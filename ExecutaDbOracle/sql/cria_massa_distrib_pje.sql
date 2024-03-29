UPDATE TJRJ_PJE_AVISO_COMUNIC_INTIM TJAC
SET 
	TJAC.TJAC_DT_DISPONIBILIZACAO = trunc(SYSDATE - 3),
	TJAC_DT_IMP_INFO_CRIMINAL = trunc(SYSDATE - 3)
WHERE TJAC.TJAC_DT_DISPONIBILIZACAO < trunc(SYSDATE - 3)
AND TJAC.TJAC_DK IN 
(
	SELECT TJAC_DK 
	FROM  TJRJ_PJE_AVISO_COMUNIC_INTIM TJAC
	  inner join TJRJ_PJE_MOTIVO_NAO_DISTRIB PJND on PJND.PJND_DK = TJAC.TJAC_PJND_DK 
	WHERE 1=1
	AND PJND.PJND_IN_INTERV_SECRETARIA = 'S'
);

COMMIT;