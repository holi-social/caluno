'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, User } from 'lucide-react';
import { Button, Card, CardContent, Checkbox, Input, Label } from '@repo/ui';
import { Logo } from '@/components/logo';
import { StepProgress } from '@/components/step-progress';
import { STEP_PROGRESS } from '@/lib/types';

interface Form3Props {
  onSubmit: (name: string, email: string, gdprConsent: boolean) => void;
  loading: boolean;
}

export function Form3({ onSubmit, loading }: Form3Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gdprConsent) {
      setGdprError(true);
      return;
    }
    onSubmit(name, email, gdprConsent);
  }

  return (
    <div className="relative flex flex-col gap-4 items-center pt-6 pb-4 px-4 min-h-full">
      <StepProgress value={STEP_PROGRESS['form-3']} />

      <Logo />

      <h1 className="text-[24px] font-medium leading-8 w-full">
      Für mehr WIR in Wirkung - wer bist du und wie dürfen wir dich zukünftig erreichen
      </h1>
      <p className="text-sm text-muted-foreground leading-6 w-full">
      Mit deinen Daten können wir besser planen und dich auch zukünftig für Neuigkeiten, Schichten und Events kontaktieren. Vielen Dank dafür!
      </p>
      <Card className="w-full">
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-end">
            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="volunteer-name" className="text-base font-medium">
                Name und Nachname
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="volunteer-name"
                    type="text"
                    placeholder="Helperina Helper"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="volunteer-email" className="text-base font-medium">
                E-Mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="volunteer-email"
                    type="email"
                    placeholder="helperina@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="gdpr-consent"
                    checked={gdprConsent}
                    onCheckedChange={(checked) => {
                      const val = checked === true;
                      setGdprConsent(val);
                      if (val) setGdprError(false);
                    }}
                    className="mt-0.5 shrink-0"
                    aria-required="true"
                    aria-describedby={gdprError ? 'gdpr-error' : undefined}
                  />
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="gdpr-consent"
                      className="text-base font-medium leading-snug cursor-pointer"
                    >
                      Ich stimme zu, dass meine Daten von Hanseatic Help verarbeitet werden.
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Deine Daten nutzen wir nur intern und geben sie nie in identifizierbarer Form weiter.
                    </p>
                    <Link
                      href="/datenschutz"
                      className="text-sm text-muted-foreground underline underline-offset-2"
                    >
                      Datenschutzhinweis
                    </Link>
                  </div>
                </div>
                {gdprError && (
                  <p id="gdpr-error" role="alert" className="text-sm text-destructive">
                    Bitte stimme der Datenschutzerklärung zu, um fortzufahren.
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              Weiter
            </Button>
          </form>
        </CardContent>
      </Card>

    
    </div>
  );
}
