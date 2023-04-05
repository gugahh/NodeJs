"use strict";
const nodemailer = require("nodemailer");
const date = require('date-and-time');

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

// var p_mail_server;
var p_mail_target;
var p_usuario;
var p_senha;

// console.log("\n===== FTP Probe (ftprobe.js) =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 3) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados: \n\t(1) p_mail_target, \n\t(2) usuario, e \n\t(3) senha como parametros.");
  console.error("\n* Exemplo: node mailsender.js gugahh.br@gmail.com userX senhaX");
  process.exit();
}

p_mail_target = myArgs[0];
p_usuario = myArgs[1];
p_senha = myArgs[2];


// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  //let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp-relay.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: p_usuario, // generated ethereal user
      pass: p_senha //'dsyqkgerolaqbgkm', // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Gugahh" <gugahh.br@gmail.com>', // sender address
    to: p_mail_target, // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

main().catch(console.error);