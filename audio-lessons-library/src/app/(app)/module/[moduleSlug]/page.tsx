import { Suspense } from "react";
import ModuleClient from "./ModuleClient";

type ModulePageProps = {
  params: {
    moduleSlug: string;
  };
};

export default function ModulePage({ params }: ModulePageProps) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading module...</p>}>
      <ModuleClient moduleSlug={params.moduleSlug} />
    </Suspense>
  );
}
