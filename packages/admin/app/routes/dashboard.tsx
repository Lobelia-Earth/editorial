import InfoCard from "@/components/infoCard";
import {
  useGetDataCountQuery,
  useGetFileCountQuery,
} from "@/lib/store/slices/editorialApi";
import { useAppSelector } from "@/lib/store/hooks";

import DraftsSection from "./drafts";
import UnpublishedChangesSection from "./unpublishedChangesSection";

export default function Dashboard() {
  const { data: dataCount, isLoading: dataCountLoading } =
    useGetDataCountQuery();
  const { data: fileCount, isLoading: fileCountLoading } =
    useGetFileCountQuery();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h2>
          {user?.email && (
            <p className="text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          )}
        </div>
        <div className="flex flex-row gap-2 grid-cols-12">
          <InfoCard
            className="w-full sm:w-44"
            title="Items"
            value={dataCount}
            isLoading={dataCountLoading}
          />
          <InfoCard
            className="w-full sm:w-44"
            title="Files"
            value={fileCount}
            isLoading={fileCountLoading}
          />
        </div>

        {/* <RecentActivitySection /> */}
        <UnpublishedChangesSection />
        <DraftsSection />
      </div>
    </div>
  );
}
