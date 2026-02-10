import { useGetFilesQuery } from "@/lib/store/slices/editorialApi";
import { cn } from "@/lib/utils";
import { ExternalLink, FileIcon, Pencil, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [imageMetadata, setImageMetadata] = useState<{
    width?: number;
    height?: number;
    size?: number;
    format?: string;
    name?: string;
  } | null>(null);

  const isImage = (url: string) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getImageMetadata = (url: string) => {
    const img = new Image();
    img.onload = () => {
      // Try to get file size from fetch
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          setImageMetadata({
            width: img.width,
            height: img.height,
            size: blob.size,
            format:
              blob.type.split("/")[1]?.toUpperCase() ||
              url.split(".").pop()?.toUpperCase(),
            name: url,
          });
        })
        .catch((err) => {
          console.error("Error fetching image for size:", err);
          // Fallback without size
          setImageMetadata({
            width: img.width,
            height: img.height,
            format: url.split(".").pop()?.toUpperCase(),
            name: url,
          });
        });
    };
    img.onerror = (err) => {
      console.error("Error loading image for metadata:", err);
      // Fallback for invalid images
      setImageMetadata({
        name: url,
        format: url.split(".").pop()?.toUpperCase(),
      });
    };
    img.src = url;
  };

  useEffect(() => {
    if (value && isImage(value)) {
      getImageMetadata(value);
    } else {
      setImageMetadata(null);
    }
  }, [value]);

  const handleClear = () => {
    onChange("");
    setImageMetadata(null);
  };

  const handleFileSelect = (selectedValue: string) => {
    setFilesModalOpen(false);
    onChange(selectedValue);
  };

  return (
    <>
      {value ? (
        <div className="space-y-3">
          <div className="border rounded-lg p-4 bg-background">
            <div className="flex gap-4">
              <div className="shrink-0">
                {isImage(value) ? (
                  <div className="w-32 h-24 rounded border overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={value}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-24 rounded border bg-muted flex items-center justify-center">
                    <FileIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {imageMetadata?.name || value.split("/").pop()}
                    </p>

                    {isImage(value) && imageMetadata && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {imageMetadata.size && (
                          <span>{formatFileSize(imageMetadata.size)}</span>
                        )}
                        {imageMetadata.width && imageMetadata.height && (
                          <span>
                            {imageMetadata.width}x{imageMetadata.height}
                          </span>
                        )}
                        {imageMetadata.format && (
                          <span>{imageMetadata.format}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Open File"
                      className="h-8 w-8 shrink-0 cursor-pointer"
                      asChild
                    >
                      <Link to={`/${value}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Change File"
                      className="h-8 w-8 shrink-0 cursor-pointer"
                      onClick={() => setFilesModalOpen(true)}
                      disabled={isLoading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Remove File"
                      className="h-8 w-8 shrink-0 cursor-pointer"
                      onClick={handleClear}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Input id={id} {...register(name)} type="hidden" value={value} />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full h-24 border-2 border-dashed",
                isLoading && "opacity-50",
              )}
              onClick={() => setFilesModalOpen(true)}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isLoading ? "Loading..." : "Click to select file"}
                </span>
              </div>
            </Button>

            <Input id={id} {...register(name)} type="hidden" value="" />
          </div>
        </div>
      )}

      {isFilesModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select File</h2>

              <Button onClick={() => setFilesModalOpen(false)}>
                <X />
              </Button>
            </div>

            <Files onChange={handleFileSelect} />
          </div>
        </div>
      )}
    </>
  );
}
