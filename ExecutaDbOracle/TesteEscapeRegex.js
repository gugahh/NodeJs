function run() {

    const textToBeScaped = 
    `
    ALTER TABLE TJRJ.tjrj_pje_processo_crim	ADD CONSTRAINT pjcr_nr_proc_valid_ck
        CHECK
        (
            REGEXP_LIKE (
                PJCR_NR_PROCESSO,
                '(\d{7}-\d{2}\.\d{4}\.8\.19\.\d{4})'
            )
        );
    `
    console.log('Text to be escaped:');
    console.log('--------------------------\n\n');
    console.log(textToBeScaped);
    console.log('\n--------------------------\n\n');

    var textNowEscaped = escapaExprRegex(textToBeScaped);

    console.log('Text After Escape:');
    console.log('--------------------------\n\n');
    console.log(textNowEscaped);
    console.log('\n--------------------------\n\n');
}


/**
 * Caso a instrucao contenha um REGEXP, o conteudo do regexp deve ser
 * "escapado" (trocar / por // ).
 * @param {*} umaInstrucao 
 * @returns conteudo ja escapado
 */
 function escapaExprRegex(umaInstrucao) {
    // string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return umaInstrucao;
}

run();