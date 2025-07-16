import dotenv from 'dotenv'
import cron from 'node-cron'
import { fetchMails } from './src/fetchMails'
import { checkPresenceOfEnvVariables, debugLog } from './src/utils'
import { EMailType } from './src/types'
import { generateAndSendCertificate } from './src/certificate'
import { addFabmanTrainingRecordToUser } from './src/fabmanTrainingRecordAssignment'
import {  registerStudentInFabman } from './src/fabmanUserRegistration'

//load environment variables
dotenv.config()

//check presence of necessary environment variables to prevent runtime errors down the road
checkPresenceOfEnvVariables()

//fetch and process emails every minute
cron.schedule('* 7-23 * * *', async () => {
    try {
        debugLog(`${new Date().toISOString()}: running fetchAndProcessMails Job`)
        const mailInfos = await fetchMails();

        for (const mailInfo of mailInfos) {
            if (mailInfo.type == EMailType.BADGE) {
                //process badge mail
                await generateAndSendCertificate(mailInfo)
                await addFabmanTrainingRecordToUser(mailInfo)
            }
            if (mailInfo.type == EMailType.REGISTRATION_REQUEST) {
                //process registration request mail
                await registerStudentInFabman(mailInfo)
            }
        }

    } catch (e) {
        console.error(e)
    }
})
