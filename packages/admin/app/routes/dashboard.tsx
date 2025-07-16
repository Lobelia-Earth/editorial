import InfoCard from "@/components/infoCard";
import {
  useGetDataCountQuery,
  useGetFileCountQuery,
} from "@/lib/store/slices/editorialApi";
import RecentActivity from "./recentActivity";

export default function Dashboard() {
  const { data: dataCount, isLoading: dataCountLoading } =
    useGetDataCountQuery();
  const { data: fileCount, isLoading: fileCountLoading } =
    useGetFileCountQuery();

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-4">
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

        <div className="flex flex-col gap-4 last:mb-20">
          <h2 className="scroll-mt-[4.5rem] text-xl font-semibold leading-none capitalize">
            Recently Updated
          </h2>

          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
