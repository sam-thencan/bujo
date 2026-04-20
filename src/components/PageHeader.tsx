import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-2 pb-1 pt-1">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <Link
          href="/settings"
          className="rounded-md px-2 py-1 text-sm text-ink-400 hover:text-ink-900"
          aria-label="Settings"
        >
          ⚙
        </Link>
      </div>
    </header>
  );
}
