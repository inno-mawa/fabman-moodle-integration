import axios, { AxiosRequestConfig } from "axios";
import { convertDateToFabmanDateString, debugLog } from "./utils";
import { SMTPTransport } from "./mailConfig";
import { TBadgeMailInfo } from "./types";

export async function addFabmanTrainingRecordToUser(mailInfo: TBadgeMailInfo) {
    const { studentName, trainingName } = mailInfo
    try {
        const apiKey = process.env.FABMAN_API_KEY

        //Axios Request Configuration for the request to find the member
        const getMemberConfig: AxiosRequestConfig = {
            headers: {
                //Authorization with Bearer Scheme, containing API Key generated in Fabman
                Authorization: `Bearer ${apiKey}`
            },
            params: {
                //query for the studentName
                q: studentName,
                //limit the number of results to 2, so that ambiguities can be detected, but 
                //in case of an error never more than 2 results are sent to not crash the server
                limit: 2
            }
        }

        //execute the response to find the member
        const memberResponse = await axios.get('https://fabman.io/api/v1/members', getMemberConfig);
        //throw an error, if the member wasn't found. This can be due to the member not having
        //registered yet or the member having a different name in Moodle than in FabMan, e.g. Liv Schneider
        if (memberResponse.data.length != 1) {
            throw new Error(`Nutzer ${studentName} konnte in FabMan nicht identifiziert werden.`)
        }

        //extract id and memberNumber of the member for later reference
        const memberId = memberResponse.data[0].id as string;
        const memberNumber = memberResponse.data[0].memberNumber as string;

        debugLog(`Identified User ${studentName} in Fabman as ID ${memberId} with memberNumber ${memberNumber}`)

        //Axios Request Config to find the correct trainingCourse to later assign to the member
        const getTrainingCourseConfig: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${apiKey}`
            },
            params: {
                q: trainingName,
                limit: 1
            }
        }

        //execute request to find the right training course
        const trainingCourseResponse = await axios.get('https://fabman.io/api/v1/training-courses', getTrainingCourseConfig)

        //extract id and memberNumber of the member for later reference
        const trainingCourseId = trainingCourseResponse.data[0].id as string;
        const trainingCourseTitle = trainingCourseResponse.data[0].title as string;
        debugLog(`Identified Training ${trainingName} in Fabman as ID ${trainingCourseId} with Title ${trainingCourseTitle}`)


        //calculate JS Date in one year from today which will become the expiration date of the trainigRecord
        const today = new Date();
        const oneYearInMillis = 365 * 24 * 60 * 60 * 1000
        const inOneYear = new Date(new Date().getTime() + oneYearInMillis)

        const trainingRecordBody = {
            date: convertDateToFabmanDateString(today), //date of Assignment
            fromDate: convertDateToFabmanDateString(today), //startDate of the training record
            untilDate: convertDateToFabmanDateString(inOneYear), //expiration date of the training  record
            trainingCourse: trainingCourseId, //id of the training course to assign
        }

        //Axios Request Config to to assign a trainingRecord to a member
        const trainingRecordConfig: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${apiKey}`
            },
        }
        //execute request to assign the previously identified course to the previously identified user
        //using a trainingrecord
        await axios.post(`https://fabman.io/api/v1/members/${memberId}/trainings`, trainingRecordBody, trainingRecordConfig)
        debugLog(`Successfully assigned course ${trainingCourseTitle} to member ${memberNumber}`)

    } catch (e) {
        //if anything goes wrong during the assignment of the trainingCourse, ask the TTeam to do it manually
        sendRequestForManualAssignment(studentName, trainingName)
        throw e;
    }
}

async function sendRequestForManualAssignment(studentName: string, trainingName: string) {
    try {
        await SMTPTransport.sendMail({
            from: `"maker.space" <${process.env.OUTBOUND_MAIL_USER}>`, // sender address
            to: process.env.NOTIFICATION_MAILADDRESS, // list of receivers
            subject: `Bitte um Zuweisung eines Training Records (${studentName} / ${trainingName})`, // Subject line
            text: `Liebes TTeam,\nleider konnte dem Studi ${studentName} der Training Record ${trainingName} nicht automatisch zugewiesen werden. Bitte legt den Training Record in FabMan manuell an.`, // plain text body
            html: `<p>Liebes TTeam,<br>leider konnte dem Studi <b>${studentName}</b> der Training Record <b>${trainingName}</b> nicht automatisch zugewiesen werden. Bitte legt den Training Record in FabMan manuell an.</p>`, // html body
        });
        debugLog(`Mail mit Bitte um Zuweisung eines Trainings Records für ${studentName} versendet.`);
    } catch (err) {
        console.error("Error while sending mail", err);
    }
}