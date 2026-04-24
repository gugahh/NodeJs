function divide(num1 = 1, num2 = 1) {
    return num1 / num2; 
}

function divideObject(obj = {num1: 1, num2: 1}) {
    return obj.num1 / obj.num2;
}

function noargsfunc(){
    if(arguments.length === 0) {
        return 'Não foram passados argumentos';
    }
    return arguments[0];
}

function showStuff(param) {
    console.log(`Você forneceu: ${param}`);
}

const soma = function(num1, num2) {return num1 + num2}

// console.log(divide(10));
// console.log( divideObject() );
console.log(noargsfunc());
showStuff('Ludo');
showStuff(.19);
showStuff();
showStuff(NaN);
showStuff(null);
console.log(soma(1,18));