import { useGetFilesQuery } from "@/lib/store/slices/editorialApi";
import { useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import Files from "./files";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function FilePicker({
  value,
  name,
  register,
  onChange,
}: {
  value: string;
  name: string;
  register: UseFormRegister<Record<string, string>>;
  onChange: (value: string) => void;
}) {
  const { data: files, isLoading } = useGetFilesQuery();
  const [isFilesModalOpen, setFilesModalOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value}
          readOnly
          {...register(name)}
          onClick={() => {
            setFilesModalOpen(true);
          }}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border p-2 rounded"
        />
        <Button
          type="button"
          onClick={() => onChange("")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear
        </Button>
      </div>

      {isFilesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select File</h2>
              <Button onClick={() => setFilesModalOpen(false)}>×</Button>
            </div>
            <Files
              onChange={(value) => {
                setFilesModalOpen(false);
                onChange(value);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
