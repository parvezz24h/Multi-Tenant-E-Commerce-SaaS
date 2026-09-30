import { Label } from "@/components/ui/label";

type FormFieldProps = {
  id: string;
  label: string;
  hint?: React.ReactNode;
  errors?: string[];
  children: React.ReactNode;
};

/** Label + control + hint/error. The control should set `aria-describedby={`${id}-desc`}`. */
export function FormField({ id, label, hint, errors, children }: FormFieldProps) {
  const error = errors?.[0];
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {(error || hint) && (
        <p
          id={`${id}-desc`}
          className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
