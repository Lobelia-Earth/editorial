import Files from './files';

export default function FilesPage() {
  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        <div className="max-w-[800px] rounded-xl border">
          <Files />
        </div>
      </div>
    </div>
  );
}
