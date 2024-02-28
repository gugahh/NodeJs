const date = require('date-and-time');
const fs = require('fs');
const path = require('path');

// var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_ftp_server;
//var p_file_path;
var p_usuario;
var p_senha;

var arrArquivos = [];

// console.log("\n===== List Local Files (listlocalfiles.js) =====");

// console.log("\np_ftp_server: \t" + p_ftp_server);
// console.log("File Path: \t" + p_file_path);
// console.log("Usuario: \t\t" + p_usuario + "\nSenha: \t\t\t(Foi atribuída)."  + "\n");

// Callback File
function callbackFile(filePath, fileRef) {
    console.log("File: " + filePath + "\tSize: \t" + fileRef.size + " bytes\tTimeStamp: " + fileRef.mtime);
    //console.log(fileRef);
    return;
}

// Callback Directory
function callbackDirectory(filePath, fileRef) {
    //console.log("Diretorio: " + filePath);
    console.log(">> DIR: " + filePath);
    //console.log(fileRef);
}

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

        walkSync(testFolder, callbackFile, callbackDirectory)

        console.log("Sucesso. Data: " + date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss'));

    }
    catch(err) {
        // console.log('FALHA - Arquivo (' + p_file_path + ') NÃO encontrado! - '
        //    + date.format(new Date(),'ddd, DD/MM/YYYY HH:mm:ss'));
        console.log(err);
    }

    function walkSync(currentDirPath, _callbackFile, _callBackDirectory) {
        fs.readdirSync(currentDirPath).forEach(function (name) {
            var filePath = path.join(currentDirPath, name);
            var fileRef = fs.statSync(filePath);

            if (fileRef.isFile()) {
                _callbackFile(filePath, fileRef);
            } else 

            if (fileRef.isDirectory()) {
                _callBackDirectory(filePath, fileRef);
                walkSync(filePath, _callbackFile, _callBackDirectory);
            }
        });
    }

}

run();
