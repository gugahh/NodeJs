DROP INDEX "TJRJ"."ACOS_TEIP_DK_UK" ;
CREATE UNIQUE INDEX TJRJ.ACOS_TEIP_DK_UK ON
TJRJ.TJRJ_AVISO_COMUNIC_STATUS 
(
    ACOS_AVCI_DK, 
    ACOS_TEIP_DK,
    CASE
        WHEN ACOS_ORIGEM_INFORMACAO <> 'PJE' THEN 0
        WHEN (ACOS_ORIGEM_INFORMACAO = 'PJE'
            AND 
            (
                ACOS_TEIP_DK IN 
                (
                    2,
                    3,
                    6 
                )
            )
        ) THEN ACOS_DK
        ELSE 0
    END
) ;

ALTER TABLE TJRJ.TJRJ_AVISO_COMUNIC_STATUS DROP CONSTRAINT ACOS_COM_NR_PROTOCOLO_CK ;