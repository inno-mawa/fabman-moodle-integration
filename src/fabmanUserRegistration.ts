import { TFabManMember, TMailInfo, TRegistrationRequestMailInfo } from "./types";
import axios, { AxiosRequestConfig } from "axios";
import { CookieJar } from "tough-cookie"
import { wrapper } from "axios-cookiejar-support"

import * as cheerio from "cheerio"
import { SMTPTransport } from "./mailConfig";
import { debugLog, splitName } from "./utils";

/**
 * Das Feld, indem die Matrikelnummer auf der Feedback anzeigen Seite steht ist konstant. 
 * Der Name des Feldes ändert sich ggf. wenn das Feedback Formular angepasst wird.
 * Dann am besten ein Feedback ausfüllen und eine einzigartige Nummer in das Feedback eintragen,
 * den Link in der Mail zum Feedback anzeigen anklicken, das HTML abspeichern und nach der Nummer suchen.
 * Dann den name des <input> Attributs hier reinkopieren
 */
const MATID_FIELDNAME = "numeric_169664"



export async function registerStudentInFabman(mailInfo: TRegistrationRequestMailInfo) {
    try {
        const matId = await getMatIdFromFeedbackLink(mailInfo);

        const { firstName, lastName } = splitName(mailInfo.studentName)

        const fabmanMember: TFabManMember = {
            emailAddress: `${matId}@stud.hs-mannheim.de`,
            account: process.env.FABMAN_ACCOUNT_ID,
            firstName: firstName,
            lastName: lastName
        }

        await createFabmanMember(fabmanMember)
    }
    catch (e) {
        sendRequestForManualMemberCreation(mailInfo)
        throw e;
    }
}

export async function getMatIdFromFeedbackLink(mailInfo: TRegistrationRequestMailInfo): Promise<string> {
    //use cookie jar with axios to allow for automatic cookie handling
    const jar = new CookieJar();
    const axiosMoodleClient = wrapper(axios.create({
        baseURL: 'https://moodle.hs-mannheim.de',
        withCredentials: true,
        jar,
    }));

    //get moodle login creds from env
    const moodlePassword = process.env.MOODLE_PASSWORD
    const moodleUsername = process.env.MOODLE_USERNAME

    let resp;

    // get login page html
    resp = await axiosMoodleClient.get('/login/index.php')

    // load login html into cheerio
    // cheerio allows to search html files in a similar way to jquery
    const $loginPage = cheerio.load(resp.data);

    // find hidden input containing the login token inside the loginPage
    const loginToken = $loginPage('input[type="hidden"][name="logintoken"]').attr('value');
    if (!loginToken) {
        throw new Error("could not find logintoken in login page html")
    }

    //prepare payload for login request
    const moodleLoginFormData = new FormData();
    moodleLoginFormData.append("username", moodleUsername)
    moodleLoginFormData.append("password", moodlePassword)
    moodleLoginFormData.append("logintoken", loginToken)

    //send the login request
    //the response contains the set-cookie header to set the authentication cookie
    //which are handled automatically by the cookie jar
    resp = await axiosMoodleClient.post('/login/index.php', moodleLoginFormData)

    //get view feedback page
    resp = await axiosMoodleClient.get(mailInfo.feedbackLinkShort)

    //load view feedback page into cheerio
    const $feedbackPage = cheerio.load(resp.data)

    //extract and return input that contains the matrikelnummer (matId)
    const matId = $feedbackPage(`input[name="${MATID_FIELDNAME}"]`).attr('value');
    if (!matId) {
        throw new Error(`Matrikelnummer could not be extracted from view feedback page. searched for: ${MATID_FIELDNAME}`)
    }
    return matId;
}

export async function createFabmanMember(fabManMember: TFabManMember) {
    const apiKey = process.env.FABMAN_API_KEY

    //prepare request config
    const axiosPostMemberConfig: AxiosRequestConfig = {
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
    }

    //send request to create the user in fabman
    await axios.post('https://fabman.io/api/v1/members', fabManMember, axiosPostMemberConfig)
    debugLog(`Member ${fabManMember.firstName} ${fabManMember.lastName} was created in fabman and should receive a registration confirmation via email.`)
}

async function sendRequestForManualMemberCreation(mailInfo: TRegistrationRequestMailInfo) {
    try {
        await SMTPTransport.sendMail({
            from: `"maker.space" <${process.env.OUTBOUND_MAIL_USER}>`, // sender address
            to: process.env.NOTIFICATION_MAILADDRESS, // list of receivers
            subject: `Bitte um Erstellung eines FabMan Accounts für ${mailInfo.studentName}`, // Subject line
            text: `Liebes TTeam Mitglied. Leider konnte dem Studi ${mailInfo.studentName} kein Nutzer angelegt werden. Bitte lege den Nutzer in FabMan manuell an.`, // plain text body
            html: `<p>Liebes TTeam Mitglied. Leider konnte dem Studi ${mailInfo.studentName} kein Nutzer angelegt werden. Das ausgefüllte Formular findest du <a href=${mailInfo.feedbackLink}>hier</a>.  Bitte lege den Nutzer in FabMan manuell an.</p>`, // html body
        });
        debugLog(`Mail mit Bitte um Erstellung eines FabMan Accounts ${mailInfo.studentName} versendet.`);
    } catch (err) {
        console.error("Error while sending request for manual fabman creation", err);
    }
}
