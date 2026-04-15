import { Progress } from '@repo/ui';

interface StepProgressProps {
  value: number; // 0-100
}

export function StepProgress({ value }: StepProgressProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10">
      <Progress
        value={value}
        className="h-2 w-full rounded-none bg-primary/20"
        aria-label="Fortschritt"
        role="progressbar"
      />
    </div>
  );
}
