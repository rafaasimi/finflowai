import { cn } from '../lib/utils';

export function Progress({ value, max = 100, className, indicatorClassName }: { value: number, max?: number, className?: string, indicatorClassName?: string }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={cn("h-4 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}

