let arr1 = ['Ana', 'Renata', 'Otavia'];
let arr2 = [10, 6.5, 7.5];
const arrbid = [arr1, arr2];

const buscaAlunoENota = (nomeAluno) => {
    if (arrbid[0].includes(nomeAluno)) {
        // console.log(`${nomeAluno} existe na lista!`);
        // const alunos = arrbid[0];
        // const medias = arrbid[1];
       const [alunos, medias] = arrbid;

        let posicao = alunos.indexOf(nomeAluno);
        console.log(`\tA nota de ${nomeAluno} é: ${medias[posicao]}`); 
    } else {
        console.log(`\t${nomeAluno} NÃO existe na lista!`);
    }
}

buscaAlunoENota('Tábata');
buscaAlunoENota('Renata');