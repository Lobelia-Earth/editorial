import { Copy, Ellipsis, Trash } from "lucide-react";
import Files from "../components/files";

export default function FilesPage() {
  return (
    <div className="overflow-auto flex flex-1 p-4 gap-4">
      <div className="flex flex-col flex-1 gap-8">
        <div className="overflow-auto h-full max-w-[800px] rounded-xl border">
          <div
            className={`sticky top-0 bg-white flex items-center gap-2 py-1 px-2 border-b group`}
          >
            <div className="w-4" />
            <div className="flex flex-grow items-center gap-2 ml-2">
              <span className="text-sm font-semibold">Name</span>
            </div>
            <div className="flex w-24 items-center gap-2 ml-2">
              <span className="text-sm font-semibold">Size</span>
            </div>

            <div className="flex items-center gap-1 invisible">
              <Copy size={14} />
              <Trash size={14} />
              <Ellipsis size={14} />
            </div>
          </div>

          <Files />
        </div>
      </div>
    </div>
  );
}
