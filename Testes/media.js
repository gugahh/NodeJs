const media = (arr) => {
    let somatorio = 0;
    arr.forEach(element => {somatorio += element});
    return somatorio / arr.length;
}

let notas = [1, 10, 1, 0];
// const notas = [];
console.log(`Array original: ${notas}`);

// notas.push(7);
//const umNum = notas.unshift(5);
//notas.reverse();

//console.log(`O numero adicionado foi: ${umNum}`);
console.log(`A media das notas: (${notas}) é: ${media(notas)}`);

