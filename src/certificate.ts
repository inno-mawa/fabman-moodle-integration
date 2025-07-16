import path from "path";
import { debugLog, toPDF } from "./utils";
import fs from "fs";
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater";
import { SMTPTransport } from "./nodemailer";
import { buffer } from "stream/consumers";
import axios, { AxiosRequestConfig } from "axios";
import { TBadgeMailInfo } from "./types";

export async function generateAndSendCertificate(mailInfo: TBadgeMailInfo) {
    const { studentName, trainingName } = mailInfo;
    try {
        //find the student, that should receive this certificate, in FabMan and extract their email-address
        const receiverEmailAddress = await getFabmanEmailFromStudentName(studentName);
        if (!receiverEmailAddress) {
            throw new Error(`email address for ${studentName} could not be found in FabMan`)
        }
        //student email adresses are matrikelnummer@stud.hs-mannheim.de
        const studentMatId = receiverEmailAddress.split("@")[0] || "";

        const templatePath = path.resolve(__dirname, `./templates/certificate_${trainingName}_template.docx`)

        // Check if template exists
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Requested certificate template does not exist. Maybe a moodle badge was misnamed? Requested File: ${templatePath}`)
        }

        // Load the .docx file (template for the certificate) as binary content
        const certificateTemplateZipped = fs.readFileSync(
            templatePath,
            "binary"
        );

        // docx files are stored as zip files, so they need to be unzipped first

        // Unzip the content of the file
        const certificate_template = new PizZip(certificateTemplateZipped);

        /*
        Docxtemplater is the templating engine used to render the certificates. 
        More information: https://docxtemplater.com/
        
        This creates an instance of the templating engine with our previously unzipped 
        certificate template as the underlying template. 
        */
        const doc = new Docxtemplater(certificate_template, {
            linebreaks: true, //config option to ignore linebreaks in variables that are rendered into the template
        });

        //format the current datetime to german date format DD.MM.YYYY (13.06.2025)
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Monate sind 0-indexiert
        const yyyy = today.getFullYear();

        const formattedDate = `${dd}.${mm}.${yyyy}`;

        //replace the placeholders (date_today, name) in the certificate template with 
        //the respective values (formattedDate, studentName) 
        doc.render({
            date_today: formattedDate,
            student_name: studentName,
            student_matId: studentMatId
        });

        //convert the rendered certificate into a buffer to allow sending it to Gotenberg for pdf conversion 
        const certificateDocxBuffer = doc.toBuffer();

        //send the docx certificate to the gotenberg docker container and receive a stream of a PDF
        const pdfStream = await toPDF(["certificate.docx", certificateDocxBuffer])
        //convert the PDF Stream to a Buffer to allow sending it as a mail attachment
        const pdfBuffer = await buffer(pdfStream);

        //send the certificate as an attachment to the student
        await sendCertificateToStudent(studentName, studentMatId, trainingName, receiverEmailAddress, pdfBuffer)
        

    } catch (e) {
        //if an error occurs, ask the TTeam to deliver the certificate manually.
        //this can happen if a member has no email address or if the member corresponding to the student
        //could not be found, because they do not have an account or have an account under a different name
        //than their Moodle name (e.g. Liv Schneider) or a certificate template is missing etc.
        await sendRequestForManualCertificate(studentName, trainingName);
        throw e;
    }
}

async function getFabmanEmailFromStudentName(studentName: string) {
    const apiKey = process.env.FABMAN_API_KEY

    //Axios Request Config to find member in Fabman for the given student name
    const getMemberConfig: AxiosRequestConfig = {
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
        params: {
            q: studentName,
            limit: 2
        }
    }

    //execute the request to find the member
    const memberResponse = await axios.get('https://fabman.io/api/v1/members', getMemberConfig);

    //extract the email address from the member
    const memberEmail = memberResponse.data[0]?.emailAddress as string | null;

    return memberEmail
}

async function sendRequestForManualCertificate(studentName: string, trainingName: string) {
    debugLog(`requesting manual delivery of certificate ${trainingName} for ${studentName}`)
    try {
        await SMTPTransport.sendMail({
            from: `"maker.space" <${process.env.MAIL_USER}>`, // sender address
            to: process.env.NOTIFICATION_MAILADDRESS, // list of receivers
            subject: "Bitte um Zustellung eines Zertifikats", // Subject line
            text: `Liebes TTeam Mitglied. Leider konnte das ${trainingName} Zertifikat für ${studentName} nicht automatisch erstellt werden. Bitte erstelle und sende das Zertifikat manuell.`, // plain text body
            html: `<p>Liebes TTeam Mitglied. Leider konnte das <b>${trainingName}</b> Zertifikat für <b>${studentName}</b> nicht automatisch erstellt werden. Bitte erstelle und sende das Zertifikat manuell.</p>`, // html body
        });
        debugLog(`Mail mit Bitte um Zustellung eines Zertifikats für ${studentName} versendet.`);
    } catch (err) {
        console.error("Error while sending mail", err);
    }
}

async function sendCertificateToStudent(studentName: string, studentMatId: string, trainingName: string, emailAddress: string, certificate: Buffer) {
    try {
        await SMTPTransport.sendMail({
            from: `"maker.space" <${process.env.MAIL_USER}>`, // sender address
            to: emailAddress, // list of receivers
            subject: "Dein Schulungszertifikat", // Subject line
            text: "Vielen Dank für deine Teilnahme. Dein Zertifikat findest du im Anhang.", // plain text body
            html: "<p>Vielen Dank für deine Teilnahme. Dein Zertifikat findest du im Anhang.</p>", // html body
            attachments: [{
                filename: `Schulungszertifikat_${trainingName}_${studentName}.pdf`,
                content: certificate
            }]
        });
        debugLog(`sent certificate for ${studentName}, badge ${trainingName}`)
    } catch (err) {
        console.error("Error while sending mail", err);
    }
}