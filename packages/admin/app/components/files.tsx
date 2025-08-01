import { useAppSelector } from "@/lib/store/hooks";
import { selectRole } from "@/lib/store/slices/authSlice";
import {
  useCreateDirectoryMutation,
  useDeleteFileMutation,
  useGetConfigQuery,
  useGetFilesQuery,
  useUploadFilesMutation,
} from "@/lib/store/slices/editorialApi";
import { cn, formatFileSize } from "@/lib/utils";
import type { EditorialFiles } from "@isardsat/editorial-common";
import clsx from "clsx";
import {
  ChevronDown,
  Copy,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Trash,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "./ui/badge";

const textFileSuffixes = ["txt", "md", "html", "pdf"] as const;
const imageFileSuffixes = ["svg", "webp", "png", "jpeg", "jpg"] as const;

const fileTypes = [
  {
    Icon: FileImage,
    test: (node: EditorialFiles[number]) =>
      imageFileSuffixes.some((suffix) => node.name.endsWith(suffix)),
  },
  {
    Icon: FileText,
    test: (node: EditorialFiles[number]) =>
      textFileSuffixes.some((suffix) => node.name.endsWith(suffix)),
  },
] as const;

const defaultFileType = {
  Icon: File,
};

export interface TreeNodeProps {
  node: EditorialFiles[number];
  level?: number;
  onDelete: (path: string) => void;
  onChange?: (value: string) => void;
  disableActions?: boolean;
  onUpload?: (path: string, files: FileList) => void;
  onCreateFolder?: (path: string, folderName: string) => void;
}

const TreeNode = ({
  node,
  level = 0,
  onDelete,
  onChange,
  disableActions,
  onUpload,
  onCreateFolder,
}: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: config } = useGetConfigQuery();
  const role = useAppSelector(selectRole);

  const fileType = fileTypes.find((type) => type.test(node)) ?? defaultFileType;
  const isDirectory = node.type === "directory";

  const Comp = isDirectory || onChange ? "div" : Link;

  const toggleExpand = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleDirectoryUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files && onUpload) {
      onUpload(node.path, files);
    }
  };

  const handleDirectoryCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName && onCreateFolder) {
      onCreateFolder(node.path, folderName);
    }
  };

  return (
    <div className="select-none">
      <Comp
        to={`/${node.relativePath}`}
        target="_blank"
        className={`flex items-center gap-2 h-10 p-2 group hover:bg-muted/50 cursor-pointer`}
        style={{ paddingLeft: `calc(0.5rem + ${level * 20}px)` }}
        onClick={
          isDirectory
            ? toggleExpand
            : onChange
              ? () =>
                  onChange(
                    node.isLarge
                      ? `${config?.largeFilesUrl}/${node.relativePath}`
                      : node.relativePath,
                  )
              : undefined
        }
      >
        {isDirectory ? (
          <ChevronDown
            size={16}
            className={cn("transition-transform", {
              "rotate-180": isExpanded,
            })}
          />
        ) : (
          <div className="w-4" />
        )}

        <div className="flex flex-grow w-24 items-center gap-2 ml-2">
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-yellow-500" />
            ) : (
              <Folder size={16} className="text-yellow-500" />
            )
          ) : (
            <fileType.Icon size={16} className=" text-gray-500" />
          )}
          <span className="flex gap-2 items-center text-sm whitespace-nowrap text-ellipsis overflow-hidden w-full">
            {!isDirectory && node.isLarge && (
              <Badge variant="outline">Large</Badge>
            )}
            {node.name}
          </span>
        </div>

        <div className="flex w-24 justify-end gap-2">
          <span className="text-sm text-gray-500">
            {isDirectory ? "--" : formatFileSize(node.size)}
          </span>
        </div>

        {role === "developer" && !disableActions && (
          <div className="flex items-center gap-1 ml-4 group-hover:visible invisible z-50">
            {isDirectory && (
              <>
                <input
                  type="file"
                  multiple
                  onChange={handleDirectoryUpload}
                  className="hidden"
                  id={`dir-upload-${node.name}-${level}`}
                />
                <label
                  htmlFor={`dir-upload-${node.name}-${level}`}
                  className="hover:text-blue-500 p-1 hover:bg-muted rounded-sm cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <Upload size={16} />
                  <span className="sr-only">Upload files to this folder</span>
                </label>

                {/* <button
                  className="hover:text-green-500 p-1 hover:bg-muted rounded-sm"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDirectoryCreateFolder();
                  }}
                >
                  <FolderPlus size={16} />
                  <span className="sr-only">
                    Create folder in this directory
                  </span>
                </button> */}
              </>
            )}

            <button
              className={clsx(
                `hover:text-yellow-500 p-1 hover:bg-muted rounded-sm`,
                isDirectory && "hidden",
              )}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                navigator.clipboard.writeText(node.path);
              }}
            >
              <Copy size={16} />
              <span className="sr-only">Copy file URL</span>
            </button>

            <button
              className="hover:text-red-500 p-1 hover:bg-muted rounded-sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(node.path);
              }}
            >
              <Trash size={16} />
              <span className="sr-only">
                Delete this {isDirectory ? "folder" : "file"}
              </span>
            </button>

            {/* <Ellipsis size={14} className="text-gray-400" /> */}
          </div>
        )}
      </Comp>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((childNode, index) => (
            <TreeNode
              key={`${childNode.name}-${index}`}
              node={childNode}
              level={level + 1}
              onDelete={onDelete}
              onChange={onChange}
              disableActions={disableActions}
              onUpload={onUpload}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export interface FilesProps {
  disableActions?: boolean;
  onChange?: (value: string) => void;
}

export default function Files({ disableActions, onChange }: FilesProps) {
  const { data: files } = useGetFilesQuery();
  const [triggerDelete] = useDeleteFileMutation();
  const [uploadFiles] = useUploadFilesMutation();
  const [createDirectory] = useCreateDirectoryMutation();

  const role = useAppSelector(selectRole);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files) {
      try {
        await uploadFiles({ files }).unwrap();
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      try {
        await createDirectory({ name: folderName }).unwrap();
      } catch (error) {
        console.error("Create folder failed:", error);
      }
    }
  };

  const handleDirectoryUpload = async (path: string, files: FileList) => {
    try {
      await uploadFiles({ files, path }).unwrap();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDirectoryCreateFolder = async (
    path: string,
    folderName: string,
  ) => {
    try {
      await createDirectory({ name: folderName, path }).unwrap();
    } catch (error) {
      console.error("Create folder failed:", error);
    }
  };

  const fileList = useMemo(
    () =>
      files
        ?.toSorted((a, b) => {
          if (a.type === "directory" && b.type !== "directory") return -1;
          if (a.type !== "directory" && b.type === "directory") return 1;

          return a.name.localeCompare(b.name);
        })
        .map((file) => (
          <TreeNode
            key={file.name}
            node={file}
            onDelete={triggerDelete}
            onChange={onChange}
            disableActions={disableActions}
            onUpload={handleDirectoryUpload}
            onCreateFolder={handleDirectoryCreateFolder}
          />
        )),
    [files, disableActions, onChange],
  );

  return (
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

        {role === "developer" && !disableActions && (
          <div className="flex items-center gap-1">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="hover:text-blue-500 p-1 hover:bg-muted rounded-sm cursor-pointer"
            >
              <Upload size={16} />
              <span className="sr-only">Upload files</span>
            </label>

            {/* <button
              onClick={handleCreateFolder}
              className="hover:text-green-500 p-1 hover:bg-muted rounded-sm"
            >
              <FolderPlus size={16} />
              <span className="sr-only">Create folder</span>
            </button> */}
          </div>
        )}
      </div>

      {fileList}
    </div>
  );
}
