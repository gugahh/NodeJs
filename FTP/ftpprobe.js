const date = require('date-and-time');
const ftp = require('basic-ftp');

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_ftp_server;
var p_file_path;
var p_usuario;
var p_senha;

// console.log("\n===== FTP Probe (ftprobe.js) =====");

// Obtendo definicoes do servidor de FTP a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 4) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados: \n\t(1) URL do servidor FTP, \n\t(2) caminho do arquivo, \n\t(3) usuario, e \n\t(4) senha como parametros.");
  console.error("\n* Exemplo: node ftpprobe.js gugahh.zapto.org /volume1/Public/testfile.txt userX senhaX");
  console.error("* Obs: Nao utilize espacos no caminho do arquivo.\n");
  process.exit();
}

p_ftp_server = myArgs[0];
p_file_path = myArgs[1];
p_usuario = myArgs[2];
p_senha = myArgs[3];

// console.log("\np_ftp_server: \t" + p_ftp_server);
// console.log("File Path: \t" + p_file_path);
// console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");

async function run() {

    const client = new ftp.Client()
    client.ftp.verbose = false;
    var filesize = 0;

    try {
        await client.access({
            host: p_ftp_server,
            user: p_usuario,
            password: p_senha,
            secure: false
        })
        //await client.ensureDir("/volume1/Public");
        filesize = await client.size(p_file_path);
        // console.log("File size: " + filesize);

        if (filesize > 0) {
            console.log('SUCESSO - Arquivo (' + p_file_path + ') encontrado! - '
                + date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss'));
        }
        // console.log(await client.list());
        // await client.uploadFrom("README.md", "README_FTP.md")
        // await client.downloadTo("README_COPY.md", "README_FTP.md")
    }
    catch(err) {
        console.log('FALHA - Arquivo (' + p_file_path + ') NÃO encontrado! - '
            + date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss'));
        console.log(err);
    }
    client.close()
}

run();
