import { adjust, convert, gotenberg, office, pipe, please, portrait, to } from "gotenberg-js-client"

export function checkPresenceOfEnvVariables() {
    const requiredEnvVariables = [
        'INBOUND_MAIL_USER',
        'OUTBOUND_MAIL_USER',
        'DEBUG_MODE',
        'FABMAN_ACCOUNT_ID',
        'GOTENBERG_URL',
        'NOTIFICATION_MAILADDRESS',
        'MOODLE_USERNAME',
        'FABMAN_API_KEY',
        'INBOUND_MAIL_PASSWORD',
        'OUTBOUND_MAIL_PASSWORD',
        'MOODLE_PASSWORD'
    ]

    const missing = requiredEnvVariables.filter((envVariableName: string) => {
        return !process.env[envVariableName]
    })
    if (missing.length != 0) {
        console.error(`Missing following environment variables: ${missing.join(' ')}`)
        process.exit(1);
    }
}



export function debugLog(msg: string) {
    if (process.env.DEBUG_MODE == "TRUE") {
        console.log(msg)
    }
}

export function convertDateToFabmanDateString(date: Date): string {
    return date.toISOString().split('T')[0]
}

//helper function to convert a docx to PDF by using the gotenberg docker container
export const toPDF = pipe(
    gotenberg(''),
    convert,
    office,
    adjust({
        // manually adjust endpoint
        url: `${process.env.GOTENBERG_URL}/forms/libreoffice/convert`,
    }),
    to(portrait),
    please
)

export function splitName(fullname: string): {firstName: string, lastName: string} {
    const nameSplit = fullname.split(" ");
    const lastName = nameSplit.slice(0, -1).join(" ")
    const firstName = nameSplit.at(-1) || "";
    return {firstName: firstName, lastName: lastName}
}