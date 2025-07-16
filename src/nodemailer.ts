import nodemailer from "nodemailer"

// Create a transporter for SMTP
export const SMTPTransport = nodemailer.createTransport({
  host: "mail.hs-mannheim.de",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

