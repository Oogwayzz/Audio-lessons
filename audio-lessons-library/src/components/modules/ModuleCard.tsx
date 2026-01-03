import Link from "next/link";

type Props = {
  module: string;
  moduleSlug: string;
  weeks: number;
  lessons: number;
};

export function ModuleCard({ module, moduleSlug, weeks, lessons }: Props) {
  return (
    <Link
      href={`/module/${moduleSlug}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="text-base font-semibold tracking-tight text-neutral-900">
        {module}
      </div>
      <div className="mt-1 text-sm text-neutral-600">
        {weeks} week{weeks === 1 ? "" : "s"} · {lessons} lesson
        {lessons === 1 ? "" : "s"}
      </div>

      <div className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-700">
        <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1">
          Open
        </span>
        <span className="text-neutral-400">→</span>
      </div>
    </Link>
  );
}

