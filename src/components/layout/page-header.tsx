export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="min-w-0">
        <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h1>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
