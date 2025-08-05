import { useGetFilesQuery } from "@/lib/store/slices/editorialApi";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { Link } from "react-router";
import Files from "./files";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface FilePickerProps {
  id?: string;
  value: string;
  name: string;
  register: UseFormRegister<Record<string, string>>;
  onChange: (value: string) => void;
}

export default function FilePicker({
  id,
  value,
  name,
  register,
  onChange,
}: FilePickerProps) {
  const { isLoading } = useGetFilesQuery();
  const [isFilesModalOpen, setFilesModalOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex items-center flex-1">
          <Input
            id={id}
            {...register(name)}
            type="text"
            value={value}
            readOnly
            onClick={() => {
              setFilesModalOpen(true);
            }}
            onChange={(e) => onChange(e.target.value)}
            className="border p-2 rounded"
          />

          <Link to={`/${value}`} className="absolute right-2" target="_blank">
            <ExternalLink className="h-4" />
          </Link>
        </div>

        <Button
          type="button"
          onClick={() => onChange("")}
          className="text-white px-4 py-2 rounded"
        >
          Clear
        </Button>
      </div>

      {isFilesModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select File</h2>

              <Button onClick={() => setFilesModalOpen(false)}>
                <X />
              </Button>
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
