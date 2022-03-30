ALTER TABLE TJRJ.TJRJ_AVISO_COMUNIC_STATUS DROP CONSTRAINT ACOS_COM_NR_PROTOCOLO_CK ;

DROP INDEX "TJRJ"."ACOS_TEIP_DK_UK" ;

CREATE UNIQUE INDEX TJRJ.ACOS_TEIP_DK_UK ON
TJRJ.TJRJ_AVISO_COMUNIC_STATUS 
(
/*
    Cada intimacao, no portal, so pode ter um status uma unica vez;
    Cada intimacao, no PJE, só pode ter os status 
        ( pendente, respondido, cancelado e resolvido )
        uma unica vez - porém, como PJE admite os status: 
            RESPONDIDA_SEM_CONFIRMACAO e 
            a intimação pode voltar a ficar recebida / tácita mais de uma vez. */
    ACOS_AVCI_DK, 
    ACOS_TEIP_DK,
    CASE
        WHEN ACOS_ORIGEM_INFORMACAO <> 'PJE' THEN 0
        WHEN (ACOS_ORIGEM_INFORMACAO = 'PJE'
            AND 
            (
                ACOS_TEIP_DK IN 
                (
                    2,    -- RECEBIDA
                    3,    -- RECEBIDA_TACITA
                    6    -- RESPONDIDA_SEM_CONFIRMACAO
                )
            )
        ) THEN ACOS_DK -- permite repeticao
        ELSE 0
    END
) ;