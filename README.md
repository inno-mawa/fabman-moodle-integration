1. Badges in Moodle müssen nach dem Pattern {FabManTrainingName}_{Jahr}, also z.B. MMLC_25 angelegt werden. Weil TrainingRecords nach einem Jahr ablaufen müssen, und der Studi die Schulung dann neu machen muss, muss immer zum Jahresbeginn neue Badges für das laufende Jahr angelegt werden. Sonst funktioniert die automatische Rechtevergabe nicht, weil jeder Studi jedes Badge nur ein Mal erwerben kann.

2. Die templates im Ordner fabman-moodle-integration/src/templates müssen nach dem folgenden Pattern benannt sein: certificate_${FabManTrainingName}_template.docx, also z.B. "certificate_MMLC_template.docx". Nur so kann für jede Schulung das richtige Template ausgewählt und dementsprechend das richtige Zertifikat generiert werden.

3. Badges müssen von einem Account mit der Mailadresse angelegt werden, die in der Integration als MAIL_USER / MAIL_PASSWORD hinterlegt ist. Die Badges müssen so konfiguriert werden, dass bei Vergabe der Ersteller einer Benachrichtigung erhält. Die Badges müssen so konfiguriert werden, dass beim Abschließen der Aktivität praktische Schulung das Badge automatisch vergeben wird.

