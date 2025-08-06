# fabman-moodle-integration

# Was es it
Fabman-Moodle-Integration ist eine Integration, die es ermöglicht, automatisiert bestimmte Moodle Benachrichtigungen zu verarbeiten und die darin enthaltenen Informationen in die maker.space Management Software FabMan zu übertragen.
Die Integration ermöglicht es 
- automatisiert FabMan-Benutzer für Studis anzulegen, wenn sie ein bestimmtes Moodle-Formular ausfüllen
- automatisiert Geräteberechtigungen in FabMan an Studis zu vergeben, wenn Sie eine Schulung in Moodle abschließen
- automatisiert PDF-Schulungszertifikat zu erstellen, wenn Sie eine Schulung in Moodle abschließen

# Warum es notwendig ist
Ab sofort werden Geräteberechtigungen, Gerätebuchungen und Anwesenheitsaufzeichnungen in der Software FabMan durchgeführt, um die Zugriffskontrolle für die Geräte und Maschinen im maker.space bestmöglich zu automatisieren. Da die Software weder die Durchführung von Geräteschulungen, noch eine Registrierung über einen Self-Service anbietet, müssen diese Sachen weiterhin über Moodle abgebildet werden.  
Es existiert kein moodleseitiges Plugin zur Integration von FabMan, genauso existiert kein FabMan-seitiges Plugin für Moodle. Das Entwickeln von eigenen Moodle-Plugins ist an der TH Mannheim nicht erlaubt, genauso wie das verwenden von Webservice-Tokens. Daher musste eine externe Integration entwickelt werden, welche das Anlegen von Benutzern in FabMan sowie das Übertragen von Berechtigungen von Moodle nach FabMan ermöglicht.

# Wie es funktioniert

Da herkömmliche Wege wie das Verwenden der Moodle-API mit Webservice Tokens oder das Implementieren eines eigenen Moodle-Plugins an der TH Mannheim durch den Moodle-Administrator nicht zugelassen wird, müssen kompliziertere Umwege genommen werden. Glücklicherweise ist die Verwendung der FabMan API ([Dokumentation](https://fabman.io/api/v1/documentation)) über ein API-Token möglich.

Bestimmte Events in Moodle erzeugen immer oder nach Aktivierung der Benachrichtigung Benachrichtigungs-Emails mit den wichtigsten Eckdaten des Events. Mit Hilfe eines IMAP-Clients lassen sich diese E-Mails automatisiert auslesen und die darin enthaltenen Daten verarbeiten und über HTTP-Anfragen an die FabMan-API in FabMan übertragen.

## Registrierung über den Moodle Kurs
Schauen wir uns zunächst die Registrierung in FabMan über den Moodle-Kurs an.
Wie bereits erwähnt lässt FabMan keine Self-Service Registrierung zu, die Nutzer müssen durch einen Administrator angelegt werden. Glücklicherweise lässt sich dies über die API abbilden, sodass wir einfach eine API-Anfrage mit einem Administratortoken ausführen können, um den Nutzer anzulegen.  

Um Missbrauch zu vermeiden, sollen sich nur genau die Studis in FabMan registrieren können, die Teilnehmer im maker.space Kurs sind und ggf. Voraussetzungen wie das Unterschreiben der Nutzungsordnung erfüllt haben. Außerdem sollen die FabMan Accounts für Studis immer auf ihre Studi-Email, um zu vermeiden, dass Studis mehrere Accounts erstellen. Außerdem kann so die in der E-Mail Adresse enthaltene Matrikelnummer für die Zertifikatserstellung verwendet werden. Die Studi-Email Adresse kann aus matrikelnummer@stud.hs-mannheim.de zusammengesetzt werden, es muss also nur die Matrikelnummer der Studis erfasst werden.

Benötigt wird also eine Art Formular im Moodle Kurs, welches in irgendeiner Art eine Benachrichtigung erzeugt, welche von der Integration automatisch verarbeitet werden kann. Dazu gibt es in Moodle den "Feedback" Baustein. Ein Feld zur Erfassung der Matrikelnummer wird eingefügt. Sobald ein Studi sein "Feedback" absendet, erhält der Ersteller des Feedback-Formulars eine E-Mail, in welcher der Name des Studis steht. Außerdem ist ein Link enthalten, welcher zu einer Übersicht über die Antworten des Studis enthält. Das "name" Attribut des HTML-Felds, indem die Matrikelnummer steht, ist über Antworten verschiedener Studis hinweg konsistent, ändert sich allerdings mit jedem neu erstellten Feedback-Formular. Nach initialem Anlegen und jeder Änderung des Feedback Formulars muss das "name" Attribut des HTML-Felds mit der Matrikelnummer neu identifiziert und in der .env dieser Integration aktualisiert werden. Wenn die Integration nun im eingebundenen IMAP-Postfach eine E-Mail mit einer Benachrichtigung erhält, dass ein Studi ein Feedback-Formular zur Fabman Anmeldung ausgefüllt hat, folgt sie dem Link in der E-Mail und extrahiert via Web-Scraping (mit npm cheerio) die Matrikelnummer. So wird ein Datensatz mit Name des Studi, und E-Mail (matrikelnummer@stud.hs-mannheim.de) aufgebaut, welcher dann zur Erstellung eines FabMan-Nutzers verwendet wird. FabMan versendet automatisch eine E-Mail an den neuen Nutzer mit der Aufforderung, ein Passwort festzulegen und den Account einzurichten.
Tritt in diesem Prozess ein Fehler auf, wird das Teaching-Team per Mail benachrichtigt und darum gebeten, den Account von Hand anzulegen.

## Rechteübertragung und Zertifikatserstellung nach Schulungsabschluss
In FabMan lässt sich für Geräte einstellen, dass sie nur nach Abschluss einer bestimmten Schulung / Erlangung einer bestimmten Kenntnis verwendet und gebucht werden dürfen. Die Erlangung einer solchen Kenntnis wird über "Training Records" abgebildet. Absolviert ein Studi bspw. die Lasercutter Schulung und erlangt die Kenntnis über den Umgang mit dem Lasercutter, erhält er einen Training Record für den Lasercutter mit aktuellem Datum. Die Vergabe dieser Training Records kann auch über die API geschehen.Die Integration muss somit nur mitbekommen, wenn ein Studi eine Schulung abschließt.  
Die Schulungen für rote Geräte enthalten immer einen Präsenzteil, für den ein Termin im Moodle-Kurs gebucht werden muss. Kursdozenten können nach diesen Terminen in Moodle eine Bewertung für die Teilnahme vergeben welche widerspiegelt, ob die Studis teilgenommen haben oder nicht und daraus abgeleitet wird, ob die in Moodle als Aktivität interpretierte Schulung erfolgreich abgeschlossen wurde oder nicht.
Schulungen für gelbe Geräte enthalten nur einen Online-Teil in Moodle, welcher automatisch als erfolgreich abgeschlossen markiert wird.
Das erfolgreiche Abschließen von Aktivitäten in Moodle allein erzeugt keine Benachrichtigungen. Allerdings können Moodle-Badges (= Abzeichen) eingerichtet werden, welche bei erfolgreichem Abschluss bestimmter Aktivitäten automatisch an die Teilnehmer vergeben werden können. In diesen lässt sich konfigurieren, dass der Ersteller der Badges bei Vergabe des Badges per Mail benachrichtigt wird.
Erhält das IMAP-Postfach der Integration eine E-Mail über eine Badgevergabe passieren zwei Sachen:
### Rechtevergabe
Der Name der Studis und der Name des vergebenen Badges wird aus der E-Mail extrahiert. Der Studi wird mit seinem Namen in FabMan gesucht. Da die Erstellung des Accounts ebenfalls über den Moodle-Anzeigenamen geschehen ist, kann es nicht zu Problemen mit Zweitnamen oder unterschiedlichen Schreibweisen kommen. Wird der Studi gefunden, wird ihm der TrainingRecord verlieren, welcher den gleichen Namen trägt wie der Badge.
Tritt ein Fehler auf, wird das Teaching-Team per Mail benachrichtigt und darum gebeten, die Rechte manuell zu vergeben.
### Zertifikatserstellung
Der Name der Studis und der Name des vergebenen Badges wird aus der E-Mail extrahiert. Der Studi wird mit seinem Namen in FabMan gesucht. Aus dem FabMan Nutzer Datensatz wird die E-Mail Adresse extrahiert, welche die Matrikelnummer enthält. Anhand des Badgenamens wird das entsprechende Zertifikatstemplate ausgewählt. In das Template werden Name und Matrikelnummer des Studis eingesetzt und das Template wird in ein PDF umgewandelt. Abschließend wird das Zertifikat an den Studi und als Kopie an das Teaching-Team zur Nachverfolgung gesendet.
Tritt ein Fehler auf, wird das Teaching-Team per Mail benachrichtigt und darum gebeten, das Zertifikat manuell zu erstellen.


# Anforderungen an den IT-Kontext
Damit alles wie oben beschrieben funktioniert, gibt es einige Voraussetzungen. Die Menge und der Detailgrad der Voraussetzungen sind vor allem der Unflexibilität der Moodle-Administration und der daraus notwendigen zahlreichen Workarounds geschuldet.

## Mail-Postfächer
Die Integration muss Zugriff auf ein E-Mail Postfach haben, welches die oben beschriebenen Benachrichtigungen erhält. Am einfachsten ist es, wenn ein Teaching-Team Member alle benachrichtigungsrelevanten Elemente / Aktivitäten in Moodle anlegt, damit alle Benachrichtigungen in einem Postfach landen. Dafür ist eine Funktionsmailadresse (maker.space@hs-mannheim.de) eingerichtet. 
Der entsprechende Teaching-Team Member leitet alle seine Moodle-Emails an dieses Postfach weiter.

## Feedback Formular für die FabMan Anmeldung

## Terminbuchungskalender für Präsenzschulungen

## Badges

## FabMan Training Records

# Anwendung starten
- Auf einem docker-fähigen Gerät (bspw. RaspberryPi) [Docker](https://www.docker.com/) installieren.
- [git](https://git-scm.com/) installieren
- Kommandozeile öffnen
- Dieses Repository clonen `git clone https://github.com/inno-mawa/fabman-moodle-integration`
- In das Repository navigieren `cd fabman-moodle-integration`
- .env-template Datei anpassen und secrets an den entsprechenden Stellen ergänzen
- .env-template Datei in .env umbenennen
- `docker compose build` ausführen
- `docker compose up` (Ausführung im Vordergrund) oder `docker compose up -d` (Ausführung im Hintergrund) ausführen.













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


TODO: alle envs in .env / .env-template moven und mit Manuel auf dem Server updaten