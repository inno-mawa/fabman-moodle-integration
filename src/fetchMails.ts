import imaps from 'imap-simple'
import _ from "lodash"
import { ParsedMail, simpleParser } from 'mailparser';
import { htmlToText } from "html-to-text";
import { EMailType, TBadgeMailInfo, TMailInfo, TRegistrationRequestMailInfo } from './types';
import { debugLog } from './utils';

/**
 * name of the moodle feedback task to search for in the mail subjects
 */
const FEEDBACK_SEARCH_STRING = "FabMan Anmeldung"
/**
 * search string to identify badge mails
 */
const BADGE_SEARCH_STRING = "wurde ausgezeichnet!"

//imap configuration
var config = {
    imap: {
        user: process.env.MAIL_USER as string,
        password: process.env.MAIL_PASSWORD as string,
        host: 'mail.hs-mannheim.de',
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};


export async function fetchMails(): Promise<TMailInfo[]> {
    debugLog("opening connection")

    //open connection to the imap server
    const connection = await imaps.connect(config)

    try {
        debugLog("opening inbox")
        //open connection to the INBOX
        await connection.openBox('INBOX');

        //prepare search options to only fetch unseen emails
        var searchCriteria = [
            'UNSEEN'
        ];
        //only fetch '' body, which is the main part that can be processed by simpleParser
        //don't 
        var fetchOptions = {
            bodies: [''],
            markSeen: false
        };

        debugLog("search for messages")
        //search messages
        const messages = await connection.search(searchCriteria, fetchOptions);


        const mailInfos = [];

        for (let msg of messages) {
            // wrap in try catch to allow all messages to be handled even if an exception occurs during processing
            try {

                await setMailToSeen(connection, msg.attributes.uid)
                
                const parsedMail = await parseMessage(msg)
                
                //set subject to "" if it is empty to prevent crashing
                const subject = parsedMail.subject || "";

                //skip mails that are not badge notifications or registration requests
                if (!(subject.includes(FEEDBACK_SEARCH_STRING) || subject.includes(BADGE_SEARCH_STRING))) {
                    continue;
                }

                const mailInfo = extractInfoFromMail(parsedMail)

                //set Mail to seen here, so that if e.g. certgen works but training
                //record update doesnt the mail isnt processed over and over again and
                //spams the user with certificates

                mailInfos.push(mailInfo)
            } catch (e) {
                console.log(`Error processing message: ${msg.attributes.uid}`)
                console.log(e)
            }
        }
        debugLog(`found ${mailInfos.length} messages to process`)
        return mailInfos;
    } finally {
        //always close the connection to the imap server, also if an error occurs
        connection.end()
    }
}


async function parseMessage(msg: imaps.Message): Promise<ParsedMail> {
    //get main part for simpleParser parsing
    const mainPart = _.find(msg.parts, { "which": "" })
    if (!mainPart) {
        throw new Error("couldnt find main part of mail (criteria: {which: ''})");
    }

    const id = msg.attributes.uid;
    const idHeader = "Imap-Id: " + id + "\r\n";

    //parse Mail
    const parsedMail = await simpleParser(idHeader + mainPart.body)
    return parsedMail;
}

function extractInfoFromMail(mail: ParsedMail): (TBadgeMailInfo | TRegistrationRequestMailInfo) {
    //if subject or body are empty, set them to empty string to avoid crashing
    const subject = mail.subject || ""
    //convert HTML body to plaintext to enable regex searching
    const html = mail.html || "";
    const body = htmlToText(html)

    if (subject.includes(BADGE_SEARCH_STRING)) {

        //Student name is at the beginning of the body and is followed by "hat alle Kriterien ..."
        const matchStudentName = body.match(/^(.+?)\s+hat alle Kriterien\s/);
        if (!matchStudentName) {
            throw new Error("Body does not contain student name")
        }
        const studentName = matchStudentName[1]

        //Badge Name is the only thing in the subject that is contained in single quotation marks
        const matchBadgeName = subject.match(/'([^']+)'/);
        if (!matchBadgeName) {
            throw new Error("Subject does not contain Badge name")
        }
        const badgeName = matchBadgeName[1]
        //badgeNames follow the Format {trainingName}_year, e.g. MMLC_25
        const trainingName = badgeName.split("_")[0]

        return {
            type: EMailType.BADGE,
            trainingName: trainingName,
            studentName: studentName
        } as TBadgeMailInfo
    }
    else if (subject.includes(FEEDBACK_SEARCH_STRING)) {

//Student name is at the beginning of the subject and is followed by "hat Fabman Anmeldung abgeschlossen"
        const matchStudentName = subject.match(/^(.+?)\s+hat FabMan Anmeldung\s/);
        if (!matchStudentName) {
            throw new Error("Subject does not contain student name")
        }
        const studentName = matchStudentName[1]

        //extract feedback link
        //match strings, that contain /mod/feedback/show_entries
        const matchFeedbackLinkShort = html.match(/(\/mod\/feedback\/show_entries[^"']*)["']/)
        if (!matchFeedbackLinkShort) {
            throw new Error("Body does not contain feedback link")
        }
        const feedbackLinkShort = matchFeedbackLinkShort[1]
        
        //match strings, that contain https://moodle.hs-mannheim.de/mod/feedback/show_entries
        const matchFeedbackLink = html.match(/(https:\/\/moodle\.hs-mannheim\.de\/mod\/feedback\/show_entries[^"']*)["']/)
        if (!matchFeedbackLink) {
            throw new Error("Body does not contain feedback link")
        }
        const feedbackLink = matchFeedbackLink[1]

        return {
            type: EMailType.REGISTRATION_REQUEST,
            studentName: studentName,
            feedbackLink: feedbackLink,
            feedbackLinkShort: feedbackLinkShort
        } as TRegistrationRequestMailInfo
    }
    else {
        throw new Error("mail could not be identified as badge or registration request")
    }

}

async function setMailToSeen(connection: imaps.ImapSimple, uid: number) {
    try {
        //add seen flag to specified mail
        await connection.addFlags(uid, '\\Seen')
        debugLog(`Mail mit UID ${uid} als gelesen markiert.`);
    }
    catch (e) {
        throw new Error('Fehler beim Setzen des Seen Flags:');
    }
}












