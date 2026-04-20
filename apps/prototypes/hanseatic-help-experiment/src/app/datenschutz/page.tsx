'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';

export default function DatenschutzPage() {
  const router = useRouter();

  return (
    <main className="min-h-dvh bg-background px-4 py-6">
      <div className="max-w-[540px] mx-auto">
        <div className="flex justify-end mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Zurück
          </Button>
        </div>

        <h1 className="text-xl font-medium leading-8 mb-3">Datenschutzhinweise</h1>
        <p className="text-sm leading-relaxed mb-8">
          Mit den nachfolgenden Datenschutzhinweisen möchten wir dich über die Verarbeitung deiner
          personenbezogenen Daten bei der Nutzung unseres Online-Angebotes informieren. Sprich uns
          bei Fragen gerne unter den angegebenen Kontaktdaten an.
        </p>

        {/* Verantwortlicher */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Verantwortlicher</h2>
          <p className="text-sm leading-relaxed mb-2">
            Verantwortlich für die in diesen Datenschutzhinweisen erläuterte Verarbeitung deiner
            personenbezogenen Daten ist:
          </p>
          <div className="text-sm leading-relaxed space-y-0.5">
            <p className="font-medium">Holi Moli GmbH</p>
            <p>Eifflerstraße 43</p>
            <p>22769 Hamburg</p>
            <p>Deutschland</p>
            <p className="mt-2">Vertretungsberechtigte Person: Björn Lampe</p>
            <p>
              E-Mail:{' '}
              <a href="mailto:support@holi.social" className="text-primary underline underline-offset-2">
                support@holi.social
              </a>
            </p>
            <p>
              Impressum:{' '}
              <a href="https://holi.social/imprint" className="text-primary underline underline-offset-2">
                holi.social/imprint
              </a>
            </p>
          </div>
        </section>

        {/* Datenschutzbeauftragter */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Kontakt Datenschutzbeauftragter</h2>
          <p className="text-sm leading-relaxed mb-2">
            Unseren Datenschutzbeauftragten, an den du dich zu allen Fragen zum Thema Datenschutz
            wenden kannst, erreichst du unter folgenden Kontaktdaten:
          </p>
          <div className="text-sm leading-relaxed space-y-0.5">
            <p className="font-medium">ISiCO GmbH</p>
            <p>Am Hamburger Bahnhof 4</p>
            <p>10557 Berlin, Deutschland</p>
            <p className="mt-2">
              E-Mail:{' '}
              <a
                href="mailto:holi.social@isico-datenschutz.de"
                className="text-primary underline underline-offset-2"
              >
                holi.social@isico-datenschutz.de
              </a>
            </p>
          </div>
        </section>

        {/* Übersicht */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Übersicht der Verarbeitungstätigkeiten</h2>
          <p className="text-sm leading-relaxed mb-2">
            Nachfolgend findest du eine Übersicht über die in unserem Onlineangebot erfolgenden
            Datenverarbeitungen:
          </p>
          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 text-foreground">
            <li>Bereitstellung des Onlineangebotes</li>
            <li>Umfrage</li>
            <li>Newsletter</li>
            <li>Nutzungsanalyse</li>
          </ul>
        </section>

        {/* Löschung */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Löschung von Daten</h2>
          <p className="text-sm leading-relaxed">
            Die von uns verarbeiteten Daten werden nach Maßgabe der gesetzlichen Vorgaben gelöscht.
            Dies bedeutet, dass Daten ohne Aufforderung durch dich gelöscht werden, wenn der Zweck
            der Verarbeitung dieser Daten entfallen ist oder sie für den Zweck nicht mehr
            erforderlich sind. Wenn du deine Einwilligung in den Erhalt des Newsletters widerrufst,
            werden deine Daten unverzüglich gelöscht.
          </p>
        </section>

        {/* Rechte */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Rechte der betroffenen Personen</h2>
          <p className="text-sm leading-relaxed mb-3">
            Dir stehen als Nutzer:in unseres Onlineangebotes und Betroffener nach der DSGVO
            verschiedene Rechte zu, die sich insbesondere aus Art. 15 bis 21 DSGVO ergeben:
          </p>
          <div className="text-sm leading-relaxed space-y-3">
            <p>
              <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Du hast das Recht, aus Gründen,
              die sich aus deiner besonderen Situation ergeben, jederzeit gegen die Verarbeitung
              der dich betreffenden personenbezogenen Daten, die aufgrund von Art. 6 Abs. 1 lit. e
              oder f DSGVO erfolgt, Widerspruch einzulegen; dies gilt auch für ein auf diese
              Bestimmungen gestütztes Profiling. Werden die dich betreffenden personenbezogenen
              Daten verarbeitet, um Direktwerbung zu betreiben, hast du das Recht, jederzeit
              Widerspruch gegen die Verarbeitung zum Zwecke derartiger Werbung einzulegen; dies
              gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht.
              Nutzer:innen können ihren Widerspruch auch über die Einstellungen ihres Browsers
              erklären. Ein Widerspruch gegen die Verwendung von Tools zu Online-Marketing-Zwecken
              kann auch über{' '}
              <a href="https://optout.aboutads.info" className="text-primary underline underline-offset-2">
                optout.aboutads.info
              </a>{' '}
              und{' '}
              <a href="https://www.youronlinechoices.com/" className="text-primary underline underline-offset-2">
                youronlinechoices.com
              </a>{' '}
              erklärt werden.
            </p>
            <p>
              <strong>Widerrufsrecht bei Einwilligungen (Art. 7 Abs. 3 DSGVO):</strong> Du hast
              das Recht, erteilte Einwilligungen jederzeit mit Wirkung für die Zukunft zu
              widerrufen.
            </p>
            <p>
              <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Du hast das Recht, eine Bestätigung
              darüber zu verlangen, ob betreffende Daten verarbeitet werden und auf Auskunft über
              diese Daten sowie auf weitere Informationen und Kopie der Daten entsprechend den
              gesetzlichen Vorgaben.
            </p>
            <p>
              <strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Du hast entsprechend den
              gesetzlichen Vorgaben das Recht, die Vervollständigung der dich betreffenden Daten
              oder die Berichtigung der dich betreffenden unrichtigen Daten zu verlangen.
            </p>
            <p>
              <strong>
                Recht auf Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18
                DSGVO):
              </strong>{' '}
              Du hast nach Maßgabe der gesetzlichen Vorgaben das Recht, zu verlangen, dass dich
              betreffende Daten unverzüglich gelöscht werden, bzw. alternativ nach Maßgabe der
              gesetzlichen Vorgaben eine Einschränkung der Verarbeitung der Daten zu verlangen.
            </p>
            <p>
              <strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Du hast das Recht,
              dich betreffende Daten, die du uns bereitgestellt hast, nach Maßgabe der gesetzlichen
              Vorgaben in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten
              oder deren Übermittlung an einen anderen Verantwortlichen zu fordern.
            </p>
            <p>
              <strong>Beschwerde bei Aufsichtsbehörde (Art. 77 DSGVO):</strong> Entsprechend den
              gesetzlichen Vorgaben und unbeschadet eines anderweitigen verwaltungsrechtlichen oder
              gerichtlichen Rechtsbehelfs, hast du ferner das Recht, bei einer
              Datenschutzaufsichtsbehörde, zum Beispiel einer Aufsichtsbehörde im Mitgliedstaat, in
              dem du dich gewöhnlich aufhältst, der Aufsichtsbehörde deines Arbeitsplatzes oder des
              Ortes des mutmaßlichen Verstoßes, eine Beschwerde einzulegen, wenn du der Ansicht
              sein solltest, dass die Verarbeitung der deine Person betreffenden personenbezogenen
              Daten gegen die DSGVO verstößt.
            </p>
          </div>
          <p className="text-sm leading-relaxed mt-3">
            Um deine hier beschriebenen Rechte geltend zu machen, kannst du dich jederzeit unter
            oben genannten Kontaktdaten an uns oder unseren Datenschutzbeauftragten wenden.
          </p>
        </section>

        {/* Verarbeitungstätigkeiten */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Die Verarbeitungstätigkeiten im Einzelnen</h2>
          <p className="text-sm leading-relaxed mb-6">
            Wir erheben und verarbeiten personenbezogene Daten insbesondere zum Zwecke der
            Bereitstellung und Verbesserung unseres Onlineangebotes. Drittanbieter speichern und
            verarbeiten Daten ausschließlich in unserem Auftrag.
          </p>

          {/* Webhosting */}
          <h3 className="text-base font-semibold mb-2">
            Bereitstellung des Onlineangebotes und Webhosting
          </h3>
          <div className="text-sm leading-relaxed space-y-3 mb-6">
            <p>
              Wir verarbeiten personenbezogene Daten, um dir unser Onlineangebot
              Nutzer:innen-freundlich und performant zur Verfügung stellen zu können. Zu den
              verarbeiteten Daten gehören technische Daten, die während der Nutzung erfasst werden,
              Kommunikations- und Metadaten.
            </p>
            <div className="border-l-2 border-border pl-3 space-y-3">
              <div>
                <p className="font-medium">Webhosting — Scaleway</p>
                <p className="text-muted-foreground">
                  Cloudspeicher, Content-Delivery-Network
                </p>
                <p>
                  Scaleway SAS, 8 Rue de la Ville-l'Évêque, 75008 Paris, France ·{' '}
                  <a href="https://www.scaleway.com/" className="text-primary underline underline-offset-2">
                    scaleway.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-medium">Content-Management — Google Fonts</p>
                <p className="text-muted-foreground">Bereitstellung von Schriftarten</p>
                <p>
                  Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland ·{' '}
                  <a
                    href="https://developers.google.com/fonts?hl=de"
                    className="text-primary underline underline-offset-2"
                  >
                    developers.google.com/fonts
                  </a>
                </p>
              </div>
              <div>
                <p className="font-medium">Content-Management — Framer</p>
                <p className="text-muted-foreground">
                  Content Management System zur Bereitstellung von holi.social
                </p>
                <p>
                  Framer B.V., Rozengracht 207, 1016 LZ Amsterdam, Niederlande ·{' '}
                  <a href="https://www.framer.com" className="text-primary underline underline-offset-2">
                    framer.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-medium">Bild- und Videooptimierung — ImageKit.io</p>
                <p>
                  ImageKit Private Limited, Caddie Commercial Tower, 5th floor, Aerocity, New
                  Delhi 110037, India ·{' '}
                  <a href="https://imagekit.io/" className="text-primary underline underline-offset-2">
                    imagekit.io
                  </a>
                </p>
              </div>
            </div>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser
              berechtigtes Interesse liegt in der Zurverfügungstellung und technischen Stabilität
              unseres Onlineangebotes.
            </p>
          </div>

          {/* Reichweitenmessung */}
          <h3 className="text-base font-semibold mb-2">
            Reichweitenmessung (ohne Einwilligung)
          </h3>
          <div className="text-sm leading-relaxed space-y-3 mb-6">
            <p>
              Wir setzen zur Analyse der Nutzung einzelner Webangebote einen
              datenschutzfreundlichen Webanalysedienst ein: Plausible Analytics. Der Einsatz
              erfolgt ausschließlich zur statistischen Auswertung der Nutzung und zur Optimierung
              unseres Angebots.
            </p>
            <p>Dabei werden folgende Daten verarbeitet:</p>
            <ul className="list-disc list-inside space-y-1 text-foreground">
              <li>Aufgerufene Seiten (URL und Pfad)</li>
              <li>Referrer (zuvor besuchte Seite)</li>
              <li>Verwendeter Browser, Betriebssystem und Gerätetyp</li>
              <li>Ungefähre geografische Herkunft (Region/Land)</li>
              <li>Zeitpunkt des Zugriffs</li>
            </ul>
            <p>
              Die Verarbeitung erfolgt ohne den Einsatz von Cookies und ohne die Speicherung von
              Informationen auf dem Endgerät der Nutzenden.
            </p>
            <p>
              Zur Ermittlung von Besuchszahlen wird ein tagesbasierter, pseudonymer Hash-Wert
              gebildet. Dieser wird aus technischen Verbindungsdaten unter Verwendung eines täglich
              wechselnden Zufallswertes erzeugt. Die zugrundeliegenden Rohdaten werden dabei nicht
              gespeichert. Eine Wiedererkennung von Nutzenden über mehrere Tage hinweg ist technisch
              ausgeschlossen.
            </p>
            <p>
              Eine Identifizierung einzelner Personen findet nicht statt. Es werden keine
              Nutzerprofile erstellt und keine Daten zu Werbe- oder Retargetingzwecken verarbeitet.
            </p>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser
              berechtigtes Interesse liegt in der bedarfsgerechten Gestaltung, technischen
              Stabilität und Optimierung unseres Onlineangebotes. Die Verarbeitung erfolgt
              ausschließlich innerhalb der Europäischen Union.
            </p>
            <p>
              Du hast das Recht, aus Gründen, die sich aus deiner besonderen Situation ergeben,
              jederzeit gegen die Verarbeitung Widerspruch einzulegen (Art. 21 DSGVO).
            </p>
            <div className="border-l-2 border-border pl-3">
              <p className="font-medium">Plausible Insights OÜ</p>
              <p>Västriku tn 2, 50403 Tartu, Estland ·{' '}
                <a href="https://plausible.io/" className="text-primary underline underline-offset-2">
                  plausible.io
                </a>
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <h3 className="text-base font-semibold mb-2">Newsletter</h3>
          <div className="text-sm leading-relaxed space-y-3 mb-6">
            <p>
              Wir verarbeiten personenbezogenen Daten zum Versand unseres Newsletters per E-Mail zu
              Neuerungen, Events und Angeboten. Außerdem messen wir die Öffnungs- und Klickraten
              des Newsletters zur technischen und inhaltlichen Verbesserung. Zu diesem Zweck
              enthalten die E-Mails einen sogenannten „web-beacon", d.h. eine pixelgroße Datei,
              die beim Öffnen des Newsletters vom Server abgerufen wird.
            </p>
            <p>
              Die Anmeldung zu unserem Newsletter erfolgt in einem Double-Opt-In-Verfahren, d.h.
              du erhältst nach der Anmeldung eine E-Mail, in der du um die Bestätigung deiner
              Anmeldung gebeten wirst. Um dich anzumelden, reicht es grundsätzlich aus, wenn du
              deine E-Mail-Adresse angibst.
            </p>
            <div className="border-l-2 border-border pl-3">
              <p className="font-medium">HubSpot</p>
              <p className="text-muted-foreground">
                Bereitstellung Kontaktformular, Management von Nutzer:innenanfragen sowie
                Analyse- und Feedbackfunktionen
              </p>
              <p>
                HubSpot, Inc., 25 First St., 2nd floor, Cambridge, MA 02141, USA ·{' '}
                <a href="https://www.hubspot.de" className="text-primary underline underline-offset-2">
                  hubspot.de
                </a>
              </p>
              <p className="mt-1">
                Data Privacy Framework:{' '}
                <a
                  href="https://www.dataprivacyframework.gov/s/participant-search/participant-detail?id=a2zt0000000TN8pAAG&status=Active"
                  className="text-primary underline underline-offset-2 break-all"
                >
                  dataprivacyframework.gov
                </a>
              </p>
            </div>
          </div>

          {/* Umfragen */}
          <h3 className="text-base font-semibold mb-2">Umfragen und Befragungen</h3>
          <div className="text-sm leading-relaxed space-y-3">
            <p>
              Wir verarbeiten personenbezogene Daten im Zusammenhang mit Umfragen und Befragungen.
              Die von uns durchgeführten Umfragen werden anonym ausgewertet. Eine Verarbeitung
              personenbezogener Daten erfolgt nur insoweit, als dies zur Bereitstellung und
              technischen Durchführung der Umfragen erforderlich ist.
            </p>
            <div className="border-l-2 border-border pl-3">
              <p className="font-medium">Tally</p>
              <p className="text-muted-foreground">
                Erstellung von Formularen sowie Umfragen und Verwaltung der Teilnehmerbeiträge
              </p>
              <p>
                Tally, August van Lokerenstraat 71, 9050 Gent, Belgien ·{' '}
                <a href="https://tally.so" className="text-primary underline underline-offset-2">
                  tally.so
                </a>
              </p>
            </div>
          </div>
        </section>

        <div className="h-8" />
      </div>
    </main>
  );
}
