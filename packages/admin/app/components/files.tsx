import { useAppSelector } from "@/lib/store/hooks";
import { selectRole } from "@/lib/store/slices/authSlice";
import {
  useDeleteFileMutation,
  useGetFilesQuery,
} from "@/lib/store/slices/editorialApi";
import { cn, formatFileSize } from "@/lib/utils";
import type { EditorialFiles } from "@isardsat/editorial-common";
import clsx from "clsx";
import {
  ChevronDown,
  Copy,
  Ellipsis,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Trash,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

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
}

const TreeNode = ({ node, level = 0, onDelete, onChange }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const role = useAppSelector(selectRole);

  const fileType = fileTypes.find((type) => type.test(node)) ?? defaultFileType;
  const isDirectory = node.type === "directory";

  const Comp = isDirectory || onChange ? "div" : Link;

  const toggleExpand = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="select-none">
      <Comp
        to={`/${node.path}`}
        target="_blank"
        className={`flex items-center gap-2 h-10 p-2 group hover:bg-muted/50 cursor-pointer`}
        style={{ paddingLeft: `calc(0.5rem + ${level * 20}px)` }}
        onClick={
          isDirectory
            ? toggleExpand
            : onChange
              ? () => onChange(node.name)
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
          <span className="text-sm whitespace-nowrap text-ellipsis overflow-hidden w-full">
            {node.name}
          </span>
        </div>

        <div className="flex w-24 justify-end gap-2">
          <span className="text-sm text-gray-500">
            {isDirectory ? "--" : formatFileSize(node.size)}
          </span>
        </div>

        {role === "developer" && (
          <div className="flex items-center gap-1 ml-4 group-hover:visible invisible z-20">
            <button
              className={clsx(
                `hover:text-yellow-500 p-1 hover:bg-muted rounded-clsx`,
                isDirectory && "invisible",
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
              <span className="sr-only">Delete this file</span>
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

  const fileList = useMemo(
    () =>
      files
        ?.toSorted((a) => (a.type === "directory" ? -1 : 1))
        .map((file) => (
          <TreeNode
            key={file.name}
            node={file}
            onDelete={triggerDelete}
            onChange={onChange}
            disableActions={disableActions}
          />
        )),
    [files],
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

        <div className="flex items-center gap-1 invisible">
          <Copy size={14} />
          <Trash size={14} />
          <Ellipsis size={14} />
        </div>
      </div>

      {fileList}
    </div>
  );
}
