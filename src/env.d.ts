// env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        /**
         * E-Mailadresse des Mailaccounts, 
         * der die Moodle Benachrichtigungen für Badges und Feedbacks des MM Kurses erhält
        */
       INBOUND_MAIL_USER: string
       /**
        * E-Mailadresse des Mailaccounts, 
        * von dem die Zertifikate an Studis verschickt werden
       */
        OUTBOUND_MAIL_USER: string
        /**
         * "TRUE": debugLog() Funktion produziert Debug Ausgaben in der Konsole
         * "FALSE": debugLog() Funktion produziert keine Debug Ausgaben in der Konsole
         */
        DEBUG_MODE: string
        /**
         * Account ID des FabMan Spaces, bspw. entnehmbar aus der Domain
         * https://fabman.io/manage/2926/ => 2926
        */
       FABMAN_ACCOUNT_ID: string
       /**
        * URL, unter der der Gotenberg Docker Container zur PDF Konvertierung erreicht werden kann.
        * In der Regel http://gotenberg:3000
       */
      GOTENBERG_URL: string
      /**
       * E-Mail Adresse, an die Benachrichtigungen für fehlgeschlagene 
       * Zertifikatserstellungen etc. gesendet werden
      */
     NOTIFICATION_MAILADDRESS: string
     /**
      * name Attribut des HTML-Tags, in dem in der Feedback-Formular View Page die Matrikelnummer enthalten ist
      */
     MATNO_FIELDNAME: string
     /**
      * Nutzername des Moodle-Accounts, welcher für das automatische Auslesen der
      *  Umfragen / Formulare (FabMan Anmeldung) verwendet wird
     */
    MOODLE_USERNAME: string
    /**
     * API-Key für FabMan, mit dem das System sich bei der FabMan API anmeldet.
     * Erhältlich über die FabMan Website.
    */
        FABMAN_API_KEY: string
        /**
         * Passwort des Mailaccounts, 
         * der die Moodle Benachrichtigungen für Badges und Feedbacks des MM Kurses erhält
         */
        INBOUND_MAIL_PASSWORD: string
        /**
         * Passwort des Mailaccounts, 
         * von dem die Zertifikate an Studis verschickt werden
         */
        OUTBOUND_MAIL_PASSWORD: string
        /**
         *  Passwort des Moodle-Accounts, welcher für das automatische Auslesen der
         *  Umfragen / Formulare (FabMan Anmeldung) verwendet wird
         */
        MOODLE_PASSWORD: string
    }
}