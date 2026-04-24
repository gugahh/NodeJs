// Teste remover do array

arrMeses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro']
console.log(arrMeses);

arrListaNeg = ['Marco','Junho', 'Agosto'] 
console.log(arrListaNeg);

function printArray(umArray) {
    umArray.forEach(element => console.log(element)); 
}

/**
 * Remove os itens de arrayExcessoes que estejam contidos em arrayOrig
 */
function removeFromArray(arrayOrig, arrayExcessoes) {
    arrayExcessoes.forEach(element => {
        idxItem = arrayOrig.indexOf(element);
        // console.log(`Removendo: ${element}`);
        if (idxItem > -1) arrayOrig.splice(idxItem, 1);
    }); 
}

removeFromArray(arrMeses, arrListaNeg);
console.log(`Array apos transformacao: ${arrMeses.toString()}`);

// arrMeses.splice(2,1);
// arrMeses.splice(4,1);
// console.log(arr);