'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';

export default function ImpressumPage() {
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

        <h1 className="text-xl font-medium leading-8 mb-1">Impressum</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
        </p>

        <div className="text-sm leading-relaxed space-y-0.5 mb-8">
          <p className="font-medium">Holi Moli GmbH</p>
          <p>Eifflerstraße 43</p>
          <p>22769 Hamburg</p>
          <p>Deutschland</p>
          <p className="mt-2">
            Webseite:{' '}
            <a href="https://holi.social" className="text-primary underline underline-offset-2">
              holi.social
            </a>
          </p>
          <p>
            E-Mail:{' '}
            <a href="mailto:support@holi.social" className="text-primary underline underline-offset-2">
              support@holi.social
            </a>
          </p>
          <p className="mt-2">Vertreten durch:</p>
          <p>Geschäftsführer: Björn Lampe</p>
          <p className="mt-2">Registereintrag:</p>
          <p>Amtsgericht Hamburg, HRB 178279</p>
          <p className="mt-2">Umsatzsteuer-ID:</p>
          <p>DE357961479</p>
          <p className="mt-2">
            Verantwortlich für den Inhalt gemäß § 18 Abs. 2 Medienstaatsvertrag (MStV):
          </p>
          <p>Björn Lampe (Eifflerstraße 43, 22769 Hamburg)</p>
        </div>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Online-Streitbeilegung</h2>
          <p className="text-sm leading-relaxed mb-2">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              className="text-primary underline underline-offset-2"
            >
              ec.europa.eu/consumers/odr
            </a>
          </p>
          <p className="text-sm leading-relaxed">
            Unsere E-Mail-Adresse findest du oben im Impressum. Wir sind nicht verpflichtet und
            nicht bereit, an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Haftungsausschluss</h2>

          <h3 className="text-base font-semibold mb-2">Haftung für Inhalte</h3>
          <div className="text-sm leading-relaxed space-y-2 mb-4">
            <p>
              Als Diensteanbieter sind wir gemäß § 7 DDG für eigene Inhalte auf diesen Seiten und
              in unseren Apps nach den allgemeinen Gesetzen verantwortlich.
            </p>
            <p>
              Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben unberührt. Eine Haftung ist jedoch erst ab dem Zeitpunkt
              der Kenntnis einer konkreten Rechtsverletzung möglich.
            </p>
            <p>
              Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte
              umgehend entfernen.
            </p>
          </div>

          <h3 className="text-base font-semibold mb-2">Haftung für Links</h3>
          <div className="text-sm leading-relaxed space-y-2">
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb übernehmen wir für diese fremden Inhalte keine Gewähr.
            </p>
            <p>
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
              verantwortlich.
            </p>
            <p>
              Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
              Rechtsverstöße überprüft; rechtswidrige Inhalte waren dabei nicht erkennbar.
            </p>
            <p>
              Eine permanente inhaltliche Kontrolle verlinkter Seiten ist ohne konkrete
              Anhaltspunkte einer Rechtsverletzung nicht zumutbar.
            </p>
            <p>
              Bei Bekanntwerden von Rechtsverletzungen werden derartige Links umgehend entfernt.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Datenschutz</h2>
          <div className="text-sm leading-relaxed space-y-2">
            <p>
              Die Nutzung unserer Webseite und Apps ist grundsätzlich ohne Angabe
              personenbezogener Daten möglich.
            </p>
            <p>
              Soweit auf unseren Seiten personenbezogene Daten (z. B. Name, Anschrift, E-Mail)
              erhoben werden, erfolgt dies stets freiwillig.
            </p>
            <p>
              Diese Daten werden ohne deine ausdrückliche Zustimmung nicht an Dritte weitergegeben.
            </p>
            <p>
              Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der
              Kommunikation per E-Mail) Sicherheitslücken aufweisen kann.
            </p>
            <p>
              Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
            </p>
            <p>
              Der Nutzung der im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur
              Übersendung von nicht ausdrücklich angeforderter Werbung wird hiermit ausdrücklich
              widersprochen.
            </p>
            <p>
              Die Betreiber behalten sich rechtliche Schritte im Falle unverlangter Zusendung von
              Werbeinformationen, etwa durch Spam-E-Mails, vor.
            </p>
            <p>Weitere Informationen findest du in unserer Datenschutzerklärung.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Urheberrecht / Copyright</h2>
          <div className="text-sm leading-relaxed space-y-2">
            <p>© 2025 Holi Moli GmbH. Alle Rechte vorbehalten.</p>
            <p>
              Texte, Bilder, Grafiken, Ton-, Video- und Animationsdateien auf dieser Website und
              den Apps unterliegen dem Urheberrecht und anderen Gesetzen zum Schutz geistigen
              Eigentums.
            </p>
            <p>
              Die Inhalte dürfen ohne vorherige schriftliche Genehmigung der Holi Moli GmbH nicht
              kopiert, verbreitet, verändert oder anderweitig verwendet werden.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
