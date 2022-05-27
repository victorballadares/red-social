const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GUSER,
        pass: process.env.GPASS
    }
});

transporter.verify().then(() => {
    console.log('Ready for send emails')
});

module.exports = transporter;