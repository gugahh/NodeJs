const date = require('date-and-time');
const fs = require('fs');
const path = require('path');

// var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_ftp_server;
//var p_file_path;
var p_usuario;
var p_senha;

// console.log("\n===== List Local Files (listlocalfiles.js) =====");

// console.log("\np_ftp_server: \t" + p_ftp_server);
// console.log("File Path: \t" + p_file_path);
// console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");

async function run() {
    try{
        console.log("Programa iniciou. Data: " + date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss'));

        const testFolder = './node_modules/';

        console.log("Folder: " + testFolder + "\n");

        /*
        fs.readdir(testFolder, (err, files) => {
            files.forEach(file => {
              // console.log(file + " - e diretorio?" + file.isDirectory()) ;
              console.log(file) ;
            });
          });
        */

        walkSync(testFolder,
            function(filePath, stat) {
                console.log("Item: " + filePath);
            }
        );

          console.log("Sucesso. Data: " + date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss'));

    }
    catch(err) {
        // console.log('FALHA - Arquivo (' + p_file_path + ') NÃO encontrado! - '
        //    + date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss'));
        console.log(err);
    }

function walkSync(currentDirPath, callback) {
    var fs = require('fs'),
        path = require('path');
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        /*
        if (stat.isFile()) {
            // callback(filePath, stat);
        } else 
        */
        if (stat.isDirectory()) {
            console.log(">> Localizou Diretorio: " + filePath);
            walkSync(filePath, callback);
        }
    });
}

}

run();
