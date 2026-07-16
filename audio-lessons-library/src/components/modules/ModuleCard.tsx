"use client";

import { useRouter } from "next/navigation";

type Props = {
  module: string;
  moduleSlug?: string | null;
  weeks: number;
  lessons: number;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ModuleCard({ module, moduleSlug, weeks, lessons }: Props) {
  const router = useRouter();

  const slug = slugify((moduleSlug ?? module) || "");
  const href = slug ? `/module/${slug}` : null;

  const go = () => {
    if (href) router.push(href);
  };

  const clickable = Boolean(href);

  return (
    <div
      role={clickable ? "link" : undefined}
      tabIndex={clickable ? 0 : -1}
      onClick={clickable ? go : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") go();
            }
          : undefined
      }
      className={[
        "rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition",
        clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : "opacity-70",
      ].join(" ")}
    >
      <div className="text-base font-semibold tracking-tight text-neutral-900">{module}</div>

      <div className="mt-1 text-sm text-neutral-600">
        {weeks} week{weeks === 1 ? "" : "s"} · {lessons} lesson{lessons === 1 ? "" : "s"}
      </div>

      <div
        aria-disabled={!clickable}
        className={[
          "mt-3 inline-flex items-center gap-2 text-sm",
          clickable ? "text-neutral-700" : "text-neutral-400",
        ].join(" ")}
      >
        <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1">Open</span>
        <span className={clickable ? "text-neutral-400" : "text-neutral-300"}>→</span>
      </div>
    </div>
  );
}

