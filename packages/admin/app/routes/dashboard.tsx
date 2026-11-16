import InfoCard from "@/components/infoCard";
import {
  useGetDataQuery,
  useGetFilesQuery,
  useGetSchemaQuery,
} from "@/lib/store/slices/editorialApi";
import type { EditorialFiles } from "@isardsat/editorial-common";
import { useMemo } from "react";
import DraftsSection from "./drafts";
import RecentActivitySection from "./recentActivity";
import UnpublishedChangesSection from "./unpublishedChangesSection";

function countFiles(files: EditorialFiles): number {
  return files.reduce(
    (acc, file) =>
      acc + (file.type === "file" ? 1 : 0) + countFiles(file.children ?? []),
    0,
  );
}

export default function Dashboard() {
  const { data, isLoading: dataLoading } = useGetDataQuery();
  const { data: schema, isLoading: schemaLoading } = useGetSchemaQuery();
  const { data: files, isLoading: filesLoading } = useGetFilesQuery();

  // Derived from the shared queries so they refresh when content changes
  const { itemCount, singleCount } = useMemo(() => {
    if (!data || !schema) return {};

    let itemCount = 0;
    let singleCount = 0;
    for (const [type, items] of Object.entries(data)) {
      if (!schema[type]) continue;
      if (schema[type].singleton) singleCount += 1;
      else itemCount += Object.keys(items).length;
    }

    return { itemCount, singleCount };
  }, [data, schema]);

  const fileCount = useMemo(() => files && countFiles(files), [files]);

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <div className="flex flex-row gap-2">
          <InfoCard
            className="w-full sm:w-44"
            title="Collection items"
            value={itemCount}
            isLoading={dataLoading || schemaLoading}
          />
          <InfoCard
            className="w-full sm:w-44"
            title="Singles"
            value={singleCount}
            isLoading={dataLoading || schemaLoading}
          />
          <InfoCard
            className="w-full sm:w-44"
            title="Files"
            value={fileCount}
            isLoading={filesLoading}
          />
        </div>

        <UnpublishedChangesSection />
        <DraftsSection />
        <RecentActivitySection />
      </div>
    </div>
  );
}
