import { Lightbulb } from 'lucide-react';
import { Logo } from '@/components/logo';

interface Form4Props {
  name: string | undefined;
  durationLabel: string;
}

export function Form4({ name, durationLabel }: Form4Props) {
  const displayName = name?.split(' ')[0] ?? 'Freund*in';


  return (
    <div className="relative flex min-h-full flex-col items-center gap-6 px-4 pt-24 pb-4">
      {/* Decorative rotated white lines — fixed, covers full viewport */}
      <img
        src="/decorative-lines.svg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          width: '101vw',
          height: '101dvh',
          top: '-0.5dvh',
          left: '-0.5vw',
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <h1 className="relative z-10 text-3xl font-bold text-center text-foreground leading-9 mb-4">
        Danke für deine Hilfe, {displayName}!
      </h1>

      {/* Card with thick blue top/bottom borders — unique design for this screen */}
      <div
        className="relative z-10 animate-card-pop bg-card w-full rounded-2xl shadow-sm flex flex-col items-center gap-2 px-4 pt-6 pb-10"
        style={{
          borderTop: '32px solid #137ac9',
          borderBottom: '32px solid #137ac9',
        }}
      >
        <Logo />
        <div className="flex flex-col gap-1 text-center text-secondary-foreground w-full mt-2">
          <p className="text-[18px] leading-7">Du hast für etwa</p>
          <p className="text-5xl font-bold leading-12">{durationLabel}</p>
          <p className="text-[18px] leading-7">geholfen, und dafür sind wir echt dankbar!</p>
        </div>
      </div>

      {/* "Did you know" — subtle secondary, semi-transparent over gradient */}
      <aside
        aria-label="Wusstest du?"
        className="relative z-[5] w-full rounded-xl bg-white/55 mt-auto animate-fade-up"
        style={{ animationDelay: '0.3s', borderTop: '8px solid #137ac9', borderBottom: '8px solid #137ac9' }}
      >
        <div className="flex flex-col items-center gap-1.5 px-3 py-3">
          {/* Icon badge + label */}
          <div className="flex items-center gap-1.5">
            <div
              aria-hidden="true"
              className="rounded-full bg-amber-400 p-1 shrink-0"
              style={{ boxShadow: '0 0 8px 1px rgba(251,191,36,0.35)' }}
            >
              <Lightbulb className="size-3 fill-white text-white" />
            </div>
            <p aria-hidden="true" className="text-foreground text-[10px] font-bold uppercase tracking-[0.01em]">
              Wusstest du?
            </p>
          </div>

          {/* Stat */}
          <p className="text-foreground text-center leading-snug">
            <span className="text-xs">In 2025 konnten wir dank eurer Hilfe </span>
            <strong className="block text-2xl font-bold leading-tight">fast 1 Mio. Artikel</strong>
            <span className="text-xs"> an Bedürftige ausgeben.</span>
          </p>

          {/* Divider */}
          <div className="w-8 h-px bg-black/20 rounded-full" aria-hidden="true" />

          {/* CTA */}
          <p className="text-foreground text-xs text-center leading-relaxed">
            Schaffen wir in diesem Jahr noch mehr?{' '}
            <strong className="font-semibold">
              Komm bald wieder und bring Freund*innen mit!
            </strong>
          </p>
        </div>
      </aside>
    </div>
  );
}