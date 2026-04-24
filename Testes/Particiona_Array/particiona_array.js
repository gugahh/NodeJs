
arrEntrada = 
[
	90742761445 ,
	90742753791 ,
	90742753789 ,
	90741461374 ,
	90740421634 ,
	90740123108 ,
	90740159981 ,
	90740060818 ,
	90740060822 ,
	90740060961 ,
	90740132887 ,
	90740172856 ,
];

function fc_particiona_10_itens(umArr) {
  const result = [];
  for (let i = 0; i < umArr.length; i += 10) {
    const chunk = umArr.slice(i, i + 10);
    while (chunk.length < 10) chunk.push(0);
    result.push(chunk);
  }
  return result;
}

arrResult = fc_particiona_10_itens(arrEntrada);

console.info(arrResult);


