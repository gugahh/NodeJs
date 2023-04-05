"use strict";
const nodemailer = require("nodemailer");
const date = require('date-and-time');

var myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var p_mail_target;
var p_smtp_server;
var p_smtp_sender_email;
var p_usuario;
var p_senha;

// console.log("\n===== FTP Probe (ftprobe.js) =====");

// Obtendo definicoes de Banco de Dados a partir da linha de comando.
if (!Array.isArray(myArgs) || myArgs.length != 5) {
  console.error("\n====Erro!====");
  console.error("* Devem ser informados: \n\t(1) tp_smtp_server, ");
    console.error("\t(2) p_smtp_sender_email, \n\t(3) usuario, \n\t(4) senha, e \n\t(5) p_mail_target como parametros.");
  console.error("\n* Exemplo: node mailsender.js smtp-relay.gmail.com sender@validmail userX senhaX destinatario@validmail");
  process.exit();
}

p_smtp_server = myArgs[0];
p_smtp_sender_email = myArgs[1];
p_usuario = myArgs[2];
p_senha = myArgs[3];
p_mail_target = myArgs[4];

console.log(myArgs);

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  //let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: p_smtp_server,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: p_usuario, // generated ethereal user
      pass: p_senha //'dsyqkgerolaqbgkm', // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: p_smtp_sender_email, // sender address
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