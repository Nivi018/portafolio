import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function KpiCard({ label, value, hint, className }: Props) {
  return (
    <div className={cn("bg-card rounded-lg border p-4 shadow-sm", className)}>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? (
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
