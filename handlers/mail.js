const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

//test your email send 
// transport.sendMail({
//     from: 'Alin <tudosie.alin@gmail.com>',
//     to: 'atudosie2001@yahoo.com',
//     subject: 'Just testing',
//     html: 'Hey I <strong>love</strong>you',
//     text: 'Hey I **love you**'
// });

const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    const inlined = juice(html);
    return inlined;
}

exports.send = async(options) =>{
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);
    const mailOptions = {
        from: `Alin Tudosie <noreply@dang.com>`,
        to: options.user.email,
        subject: options.subject,
        html: html,
        text: text
    };
    
    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions);
}