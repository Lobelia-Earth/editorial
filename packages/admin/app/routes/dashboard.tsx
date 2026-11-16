import InfoCard from "@/components/infoCard";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  useGetDataQuery,
  useGetFilesQuery,
  useGetSchemaQuery,
} from "@/lib/store/slices/editorialApi";
import {
  setCollectionsOpen,
  setSinglesOpen,
} from "@/lib/store/slices/sidebarSlice";
import type { EditorialFiles } from "@isardsat/editorial-common";
import { useMemo } from "react";
import { Link } from "react-router";
import DraftsSection from "./drafts";
import RecentActivitySection from "./recentActivity";
import UnpublishedChangesSection from "./unpublishedChangesSection";

const cardLinkClassName =
  "group w-full sm:w-44 rounded-xl text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none";
const cardClassName = "h-full transition-colors group-hover:bg-accent/50";

function countFiles(files: EditorialFiles): number {
  return files.reduce(
    (acc, file) =>
      acc + (file.type === "file" ? 1 : 0) + countFiles(file.children ?? []),
    0,
  );
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const { data, isLoading: dataLoading } = useGetDataQuery();
  const { data: schema, isLoading: schemaLoading } = useGetSchemaQuery();
  const { data: files, isLoading: filesLoading } = useGetFilesQuery();

  // Derived from the shared queries so they refresh when content changes
  const { itemCount, singleCount, collectionCount } = useMemo(() => {
    let itemCount = 0;
    let singleCount = 0;
    let collectionCount = 0;
    for (const [key, value] of Object.entries(schema ?? {})) {
      if (value.singleton) {
        singleCount += 1;
      } else {
        collectionCount += 1;
        itemCount += Object.keys(data?.[key] ?? {}).length;
      }
    }

    return { itemCount, singleCount, collectionCount };
  }, [data, schema]);

  const fileCount = useMemo(() => files && countFiles(files), [files]);
  const contentLoading = dataLoading || schemaLoading;

  const openSidebarGroup = (group: "collections" | "singles") => {
    if (isMobile) setOpenMobile(true);
    else setOpen(true);
    dispatch(
      group === "collections" ? setCollectionsOpen(true) : setSinglesOpen(true),
    );
  };

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <div className="flex flex-row gap-2">
          <button
            type="button"
            className={cardLinkClassName}
            disabled={!collectionCount}
            onClick={() => openSidebarGroup("collections")}
          >
            <InfoCard
              className={cardClassName}
              title="Collection items"
              value={contentLoading ? undefined : itemCount}
              isLoading={contentLoading}
            />
          </button>

          <button
            type="button"
            className={cardLinkClassName}
            disabled={!singleCount}
            onClick={() => openSidebarGroup("singles")}
          >
            <InfoCard
              className={cardClassName}
              title="Singles"
              value={contentLoading ? undefined : singleCount}
              isLoading={contentLoading}
            />
          </button>

          <Link to="/admin/dashboard/files" className={cardLinkClassName}>
            <InfoCard
              className={cardClassName}
              title="Files"
              value={fileCount}
              isLoading={filesLoading}
            />
          </Link>
        </div>

        <UnpublishedChangesSection />
        <DraftsSection />
        <RecentActivitySection />
      </div>
    </div>
  );
}
