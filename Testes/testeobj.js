const alunobuilder = (nome, idade, curso) => {  return {nome: nome, idade: idade, curso: curso} };
const ab = alunobuilder;

const alunosArr = [
    ab('Gustavo', 51, 'Publicidade'), 
    ab('Marcos', 37, 'Jornalismo'),
    ab('Michelle', 28, 'Filosofia'),
];

console.log(`Alunos atuais: `);
alunosArr.forEach( 
    (aluno) => {console.log(`\tnome: ${aluno.nome} \t\tidade: ${aluno.idade} \tcurso: ${aluno.curso}`)} 
    );