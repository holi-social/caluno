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
          <p className="text-[18px] leading-7">mitgemacht, und dafür sind wir echt dankbar!</p>
        </div>
      </div>
    </div>
  );
}
