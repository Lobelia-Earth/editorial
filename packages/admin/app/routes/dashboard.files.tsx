import Files from "../components/files";

export default function FilesPage() {
  return (
    <div className="overflow-auto flex flex-1 p-4 gap-4">
      <div className="flex flex-col flex-1 gap-8">
        <Files />
      </div>
    </div>
  );
}
