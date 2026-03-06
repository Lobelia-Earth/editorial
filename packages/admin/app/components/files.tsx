import {
  useCreateDirectoryMutation,
  useDeleteFileMutation,
  useGetConfigQuery,
  useGetFilesQuery,
  useUploadFilesMutation,
} from "@/lib/store/slices/editorialApi";
import { cn, formatFileSize } from "@/lib/utils";
import type { EditorialFiles } from "@isardsat/editorial-common";
import {
  Check,
  ChevronDown,
  Copy,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Trash,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
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

const defaultFileType = { Icon: File };

type CreateTarget =
  | { kind: "root" }
  | { kind: "directory"; path: string }
  | null;

function isValidFolderName(name: string) {
  if (!name.trim()) return false;
  if (name === "." || name === "..") return false;
  if (name.includes("/") || name.includes("\\")) return false;
  return true;
}

function RootCreateRow({
  visible,
  onConfirm,
  onCancel,
  disabled,
}: {
  visible: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (visible) setDraft("");
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-2 h-10 p-2 border-b"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-4" />
      <div className="flex flex-grow w-24 items-center gap-2 ml-2">
        <Folder size={16} className="text-yellow-500" />
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(draft);
            if (e.key === "Escape") onCancel();
          }}
          placeholder="New folder name"
          className="h-8 flex-1 rounded-md border px-2 text-sm"
          disabled={disabled}
        />
      </div>

      <div className="flex w-24 justify-end gap-2">
        <span className="text-sm text-gray-500">--</span>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <button
          className="p-1 hover:bg-muted rounded-sm disabled:opacity-50"
          title="Create"
          onClick={() => onConfirm(draft)}
          disabled={disabled || !draft.trim()}
        >
          <Check size={16} />
        </button>

        <button
          className="p-1 hover:bg-muted rounded-sm"
          title="Cancel"
          onClick={onCancel}
          disabled={disabled}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export interface TreeNodeProps {
  node: EditorialFiles[number];
  level?: number;

  onDelete: (relativePath: string) => void;

  onChange?: (value: string) => void;
  disableActions?: boolean;
  onUpload?: (path: string, files: FileList) => void;

  createTarget: CreateTarget;
  onStartCreateInDirectory: (dirRelativePath: string) => void;
  onConfirmCreateInDirectory: (dirRelativePath: string, name: string) => void;
  onCancelCreate: () => void;

  deleteTarget: string | null;
  onStartDelete: (relativePath: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (relativePath: string) => void;
  isDeleting: boolean;
}

const TreeNode = ({
  node,
  level = 0,
  onDelete,
  onChange,
  disableActions,
  onUpload,
  createTarget,
  onStartCreateInDirectory,
  onConfirmCreateInDirectory,
  onCancelCreate,
  deleteTarget,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
  isDeleting,
}: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftFolderName, setDraftFolderName] = useState("");

  const { data: config } = useGetConfigQuery();

  const fileType = fileTypes.find((type) => type.test(node)) ?? defaultFileType;
  const isDirectory = node.type === "directory";

  const Comp = isDirectory || onChange ? "div" : Link;

  const isCreatingHere =
    createTarget?.kind === "directory" &&
    isDirectory &&
    createTarget.path === node.relativePath;

  const isConfirmingDeleteHere = deleteTarget === node.relativePath;

  useEffect(() => {
    if (isCreatingHere) setDraftFolderName("");
  }, [isCreatingHere]);

  const toggleExpand = () => {
    if (isDirectory) setIsExpanded(!isExpanded);
  };

  const handleDirectoryUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files && onUpload) onUpload(node.relativePath, files);
  };

  const confirmCreateHere = () => {
    onConfirmCreateInDirectory(node.relativePath, draftFolderName);
  };

  return (
    <div className="select-none">
      <Comp
        to={`/${node.relativePath}`}
        target="_blank"
        className={cn(
          "flex items-center gap-2 h-10 p-2 group hover:bg-muted/50 cursor-pointer",
          isConfirmingDeleteHere && "bg-red-50 hover:bg-red-50",
        )}
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

        {!disableActions && (
          <div className="flex items-center gap-1 ml-4 group-hover:visible invisible z-50">
            {isDirectory && (
              <>
                <input
                  type="file"
                  multiple
                  onChange={handleDirectoryUpload}
                  className="hidden"
                  id={`dir-upload-${node.relativePath}-${level}`}
                />
                <label
                  htmlFor={`dir-upload-${node.relativePath}-${level}`}
                  className="hover:text-blue-500 p-1 hover:bg-muted rounded-sm cursor-pointer"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Upload size={16} />
                  <span className="sr-only">Upload files to this folder</span>
                </label>

                <button
                  className="hover:text-blue-500 p-1 hover:bg-muted rounded-sm cursor-pointer"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsExpanded(true);
                    onStartCreateInDirectory(node.relativePath);
                  }}
                  title="Create Folder"
                >
                  <FolderPlus size={16} />
                  <span className="sr-only">
                    Create folder in this directory
                  </span>
                </button>
              </>
            )}

            <button
              className={cn(
                "hover:text-yellow-500 p-1 hover:bg-muted rounded-sm cursor-pointer",
                isDirectory && "hidden",
              )}
              onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();

                try {
                  await navigator.clipboard.writeText(node.path);
                  toast.success("File URL copied to clipboard", {
                    duration: 2000,
                  });
                } catch (e) {
                  console.error("Copy failed:", e);
                  toast.error("Failed to copy to clipboard", {
                    duration: 2000,
                  });
                }
              }}
              title="Copy file URL"
            >
              <Copy size={16} />
              <span className="sr-only">Copy file URL</span>
            </button>

            {!isConfirmingDeleteHere ? (
              <button
                className="hover:text-red-500 p-1 hover:bg-muted rounded-sm cursor-pointer"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onStartDelete(node.relativePath);
                }}
                title={`Delete this ${isDirectory ? "folder" : "file"}`}
              >
                <Trash size={16} />
                <span className="sr-only">
                  Delete this {isDirectory ? "folder" : "file"}
                </span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="p-1 hover:bg-muted rounded-sm disabled:opacity-50 text-red-600 cursor-pointer"
                  title="Confirm delete"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onConfirmDelete(node.relativePath);
                  }}
                  disabled={isDeleting}
                >
                  <Check size={16} />
                  <span className="sr-only">Confirm delete</span>
                </button>

                <button
                  className="p-1 hover:bg-muted rounded-sm disabled:opacity-50 cursor-pointer"
                  title="Cancel"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onCancelDelete();
                  }}
                  disabled={isDeleting}
                >
                  <X size={16} />
                  <span className="sr-only">Cancel delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Comp>

      {isDirectory && isExpanded && (
        <div>
          {!disableActions && isCreatingHere && (
            <div
              className="flex items-center gap-2 h-10 p-2"
              style={{ paddingLeft: `calc(0.5rem + ${(level + 1) * 20}px)` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-4" />
              <Folder size={16} className="text-yellow-500" />

              <input
                autoFocus
                value={draftFolderName}
                onChange={(e) => setDraftFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmCreateHere();
                  if (e.key === "Escape") onCancelCreate();
                }}
                placeholder="New folder name"
                className="h-8 flex-1 rounded-md border px-2 text-sm"
              />

              <button
                className="p-1 hover:bg-muted rounded-sm disabled:opacity-50"
                title="Create"
                onClick={confirmCreateHere}
                disabled={!draftFolderName.trim()}
              >
                <Check size={16} />
              </button>

              <button
                className="p-1 hover:bg-muted rounded-sm"
                title="Cancel"
                onClick={onCancelCreate}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {node.children?.map((childNode, index) => (
            <TreeNode
              key={`${childNode.name}-${index}`}
              node={childNode}
              level={level + 1}
              onDelete={onDelete}
              onChange={onChange}
              disableActions={disableActions}
              onUpload={onUpload}
              createTarget={createTarget}
              onStartCreateInDirectory={onStartCreateInDirectory}
              onConfirmCreateInDirectory={onConfirmCreateInDirectory}
              onCancelCreate={onCancelCreate}
              deleteTarget={deleteTarget}
              onStartDelete={onStartDelete}
              onCancelDelete={onCancelDelete}
              onConfirmDelete={onConfirmDelete}
              isDeleting={isDeleting}
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

  const [triggerDelete, deleteState] = useDeleteFileMutation();
  const [uploadFiles] = useUploadFilesMutation();
  const [createDirectory, createDirectoryState] = useCreateDirectoryMutation();

  const [createTarget, setCreateTarget] = useState<CreateTarget>(null);

  // New: delete confirmation target (relativePath)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleUpload = async ({
    files,
    path,
  }: {
    files: FileList;
    path?: string;
  }) => {
    try {
      await uploadFiles({ files, path }).unwrap();
      toast.success("Files uploaded", { duration: 2000 });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed", { duration: 2000 });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    await handleUpload({ files });
  };

  const handleDirectoryUpload = async (path: string, files: FileList) => {
    await handleUpload({ files, path });
  };

  const cancelCreate = () => setCreateTarget(null);

  const confirmCreateAtRoot = async (name: string) => {
    const trimmed = name.trim();

    if (!isValidFolderName(trimmed)) {
      toast.error("Invalid folder name", { duration: 2000 });
      return;
    }

    try {
      await createDirectory({ name: trimmed, path: "" }).unwrap();
      toast.success("Folder created", { duration: 2000 });
      setCreateTarget(null);
    } catch (error) {
      console.error("Create folder failed:", error);
      toast.error("Create folder failed", { duration: 2000 });
    }
  };

  const confirmCreateInDirectory = async (
    dirRelativePath: string,
    name: string,
  ) => {
    const trimmed = name.trim();

    if (!isValidFolderName(trimmed)) {
      toast.error("Invalid folder name", { duration: 2000 });
      return;
    }

    try {
      await createDirectory({ name: trimmed, path: dirRelativePath }).unwrap();
      toast.success("Folder created", { duration: 2000 });
      setCreateTarget(null);
    } catch (error) {
      console.error("Create folder failed:", error);
      toast.error("Create folder failed", { duration: 2000 });
    }
  };

  const handleDelete = async (relativePath: string) => {
    try {
      await triggerDelete(relativePath).unwrap();
      toast.success("Moved to deleted", { duration: 2000 });
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Delete failed", { duration: 2000 });
    }
  };

  const startDelete = (relativePath: string) => {
    setDeleteTarget(relativePath);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async (relativePath: string) => {
    await handleDelete(relativePath);
    setDeleteTarget(null);
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
            onDelete={handleDelete}
            onChange={onChange}
            disableActions={disableActions}
            onUpload={handleDirectoryUpload}
            createTarget={createTarget}
            onStartCreateInDirectory={(dirRelativePath) =>
              setCreateTarget({ kind: "directory", path: dirRelativePath })
            }
            onConfirmCreateInDirectory={confirmCreateInDirectory}
            onCancelCreate={cancelCreate}
            deleteTarget={deleteTarget}
            onStartDelete={startDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
            isDeleting={deleteState.isLoading}
          />
        )),
    [
      files,
      disableActions,
      onChange,
      createTarget,
      deleteTarget,
      deleteState.isLoading,
    ],
  );

  return (
    <div className="overflow-auto h-full max-w-[800px] rounded-xl border">
      <div className="sticky top-0 bg-white flex items-center gap-2 py-1 px-2 border-b group">
        <div className="w-4" />
        <div className="flex flex-grow items-center gap-2 ml-2">
          <span className="text-sm font-semibold">Name</span>
        </div>
        <div className="flex w-24 items-center gap-2 ml-2">
          <span className="text-sm font-semibold">Size</span>
        </div>

        {!disableActions && (
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
              title="Upload File"
            >
              <Upload size={16} />
              <span className="sr-only">Upload files</span>
            </label>

            <button
              onClick={() => setCreateTarget({ kind: "root" })}
              className="hover:text-blue-500 p-1 hover:bg-muted rounded-sm cursor-pointer"
              title="Create Folder"
              disabled={createDirectoryState.isLoading}
            >
              <FolderPlus size={16} />
              <span className="sr-only">Create folder</span>
            </button>
          </div>
        )}
      </div>

      {!disableActions && (
        <RootCreateRow
          visible={createTarget?.kind === "root"}
          disabled={createDirectoryState.isLoading}
          onConfirm={confirmCreateAtRoot}
          onCancel={cancelCreate}
        />
      )}

      {fileList}
    </div>
  );
}
