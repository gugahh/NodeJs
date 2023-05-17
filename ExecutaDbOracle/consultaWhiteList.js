const fetch = require('cross-fetch');

const url = "https://integra.mprj.mp.br/integrajudicial/api/white-list-orgaos-busca";

const getData = async () => {
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();
		data.forEach(element => {
			console.log('id: ' + element.id);
			console.log('nome: ' + element.nome);
		});
        // console.log('DATA: ', data);
    }
};
await getData();

/*
fetch('//api.github.com/users/lquixada')
  .then(res => {
    if (res.status >= 400) {
      throw new Error("Bad response from server");
    }
    return res.json();
  })
  .then(user => {
    console.log(user);
  })
  .catch(err => {
    console.error(err);
  });
  */



/*
const myUrl = 'https://integra.mprj.mp.br/integrajudicial/api/white-list-orgaos-busca';

const response = await fetch('https://httpbin.org/post', {
	method: 'post',
	headers: {'Content-Type': 'application/json'}
});
*/
// const data = await response.json();

// console.log(data);

// ----------------------------------



