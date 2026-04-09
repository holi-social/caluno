'use client';

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(name, email, gdprConsent);
  }

  return (
    <div className="relative flex flex-col gap-4 items-center pt-6 pb-4 px-4 min-h-full">
      <StepProgress value={STEP_PROGRESS['form-3']} />

      <Logo />

      <h1 className="text-[24px] font-medium leading-8 w-full">
        Grow your impact by telling us who you are, sweet stranger
      </h1>

      <Card className="w-full">
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-end">
            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="volunteer-name" className="text-base font-medium">
                  Name and Last name
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
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="volunteer-email" className="text-base font-medium">
                  E-mail
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
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="gdpr-consent"
                  checked={gdprConsent}
                  onCheckedChange={(checked) => setGdprConsent(checked === true)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="gdpr-consent"
                    className="text-base font-medium leading-snug cursor-pointer"
                  >
                    I agree to my data being processed by Hanseatic Help
                  </Label>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground underline underline-offset-2"
                    onClick={(e) => e.preventDefault()}
                  >
                    Datenschutzhinweis
                  </a>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-base text-secondary-foreground leading-6 w-full">
        Knowing who volunteers with us and how many return helps Hanseatic Help get more
        funding. Plus, you can get a volunteering certificate and never miss cool events
        &amp; actions!
      </p>
    </div>
  );
}
