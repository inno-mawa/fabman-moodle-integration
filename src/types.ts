export enum EMailType {
    BADGE="badge",
    REGISTRATION_REQUEST="registration_request"
}

export type TBadgeMailInfo = {
    type: EMailType.BADGE
    studentName: string
    trainingName: string
}

export type TRegistrationRequestMailInfo = {
    type: EMailType.REGISTRATION_REQUEST
    studentName: string
    /**
     * Link to the view feedback page with baseurl
     */
    feedbackLinkShort: string
    /**
     * Link to the view feedback page with baseurl
     */
    feedbackLink:string
}

export type TMailInfo = TRegistrationRequestMailInfo | TBadgeMailInfo


export type TFabManMember = {
    emailAddress: string
    account: string
    firstName: string
    lastName: string
}