const somarray1 = function () {
    let soma = 0;
    for(i = 0; i < arguments.length; i++) {
        soma += arguments[i];
    }
    return soma;
}

const somarray2 = ([]) => {
    let soma = 0;
    for(i = 0; i < arguments.length; i++) {
        soma += arguments[i];
    }
    return soma;
}

console.log(somarray1(1, 14, 19, 32));
console.log(somarray1());