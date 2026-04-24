function apresentar1(nome) {
    console.log(`Meu nome é: ${nome}`);
}

const apresentar2 = function(nome) {console.log(`Meu nome é: ${nome}`)};

const apresentaArrow = nome => {console.log(`Meu nome é: ${nome}`)};

const apresentaArrow2 = (nome, sobrenome) => {console.log(`Meu nome é: ${nome} ${sobrenome}`)};

// Obs: função abaixo tem "return" implícito!
const somaArrow = (num1, num2) => `A soma de ${num1} e ${num2} é: ${num1 + num2}`;

// Obs: A função abaixo também!!
const somaArrow2 = (n1, n2) => n1 + n2;

// Mais outro return implicito!!
const apresentaArrow3 = nome => `Olá, ${nome}`;


apresentar1('Gustavo');
apresentar2('Mariana');
apresentaArrow('Ricardo');
apresentaArrow2('Bruno', 'Ribeiro');
console.log(apresentaArrow3('Juca Bala'));
console.log(somaArrow(14, 39));
console.log(somaArrow2(15, 30));