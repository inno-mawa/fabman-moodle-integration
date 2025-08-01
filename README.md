# fabman-moodle-integration

# 














## Anwendung starten
- Auf einem docker-fähigen Gerät (bspw. RaspberryPi) [Docker](https://www.docker.com/) installieren.
- Dieses repository clonen
- In der docker-compose.yml Datei an den markierten Stellen Secrets ergänzen
- Eine Kommandozeile im Verzeichnis fabman-moodle-integration öffnen
- `docker compose build` ausführen
- `docker compose up` (Ausführung im Vordergrund) oder `docker compose up -d` (Ausführung im Hintergrund) ausführen.
- die Integration läuft jetzt und überprüft in regelmäßigen Abständen (siehe app.ts) das Mailpostfach und verarbeitet ggf. neue ungelesene Mails. 

## Hinweise
1. Badges in Moodle müssen nach dem Pattern {FabManTrainingName}_{Jahr}, also z.B. MMLC_25 angelegt werden. Weil TrainingRecords nach einem Jahr ablaufen müssen, und der Studi die Schulung dann neu machen muss, muss immer zum Jahresbeginn neue Badges für das laufende Jahr angelegt werden. Sonst funktioniert die automatische Rechtevergabe nicht, weil jeder Studi jedes Badge nur ein Mal erwerben kann.

2. Die templates im Ordner fabman-moodle-integration/src/templates müssen nach dem folgenden Pattern benannt sein: certificate_${FabManTrainingName}_template.docx, also z.B. "certificate_MMLC_template.docx". Nur so kann für jede Schulung das richtige Template ausgewählt und dementsprechend das richtige Zertifikat generiert werden.

3. Badges müssen von einem Account mit der Mailadresse angelegt werden, die in der Integration als MAIL_USER / MAIL_PASSWORD hinterlegt ist. Die Badges müssen so konfiguriert werden, dass bei Vergabe der Ersteller einer Benachrichtigung erhält. Die Badges müssen so konfiguriert werden, dass beim Abschließen der Aktivität praktische Schulung das Badge automatisch vergeben wird.




Moodle Setup:
maker.space Kurs: Nutzungsordnung unterschreiben, erst wenn unterschrieben kann ein FabMan Account angelegt werden

Schulungskurse: Annahme, dass Studis die Schulung nicht machen dürfen, ohne die Nutzungsordnung unterschrieben zu haben, damit sollten Studis, die zur Schulung kommen auch schon einen FabMan Account haben. Wenn nicht, können sie den Account direkt anlegen, die Nutzungsordnung muss dafür ja eh unterschrieben werden.

Wenn Studis das erste Mal in den maker.space kommen, müssen sie ihren Studiausweis zu ihrem FabMan Konto zuweisen lassen.

!! Infoposter zur Systemumstellung o.ä.?

Es dürfen nur Leute Accounts bekommen, die auch die Nutzungsordnung unterschrieben haben!

!! In Feedback Textfeld auswählen