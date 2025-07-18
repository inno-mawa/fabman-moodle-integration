import nodemailer from "nodemailer"

// Create a transporter for SMTP
export const SMTPTransport = nodemailer.createTransport({
  host: "mail.hs-mannheim.de",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.OUTBOUND_MAIL_USER,
    pass: process.env.OUTBOUND_MAIL_PASSWORD,
  },
});


//imap configuration
export const IMAPConfig = {
    imap: {
        user: process.env.INBOUND_MAIL_USER as string,
        password: process.env.INBOUND_MAIL_PASSWORD as string,
        host: 'mail.hs-mannheim.de',
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};
