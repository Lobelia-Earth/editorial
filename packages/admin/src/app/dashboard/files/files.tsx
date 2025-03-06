'use client';

import {
  useDeleteFileMutation,
  useGetFilesQuery,
} from '@/lib/store/slices/editorialApi';
import { cn, formatFileSize } from '@/lib/utils';
import type { EditorialFiles } from '@isardsat/editorial-common';
import {
  ChevronDown,
  Copy,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Trash,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const textFileSuffixes = ['txt', 'html', 'pdf'] as const;
const imageFileSuffixes = ['svg', 'webp', 'png', 'jpeg', 'jpg'] as const;

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
}

const TreeNode = ({ node, level = 0, onDelete }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fileType = fileTypes.find((type) => type.test(node)) ?? defaultFileType;
  const isDirectory = node.type === 'directory';

  const Comp = isDirectory ? 'div' : Link;

  const toggleExpand = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="select-none">
      <Comp
        href={new URL(node.path, process.env.NEXT_PUBLIC_EDITORIAL_API_URL)}
        target="_blank"
        className={`flex items-center gap-2 h-10 p-2 group hover:bg-muted/50 cursor-pointer`}
        style={{ paddingLeft: `calc(0.5rem + ${level * 20}px)` }}
        onClick={toggleExpand}
      >
        {isDirectory ? (
          <ChevronDown
            size={16}
            className={cn('transition-transform', {
              'rotate-180': isExpanded,
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
            {isDirectory ? '--' : formatFileSize(node.size)}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-4 group-hover:visible invisible z-20">
          {isDirectory ? (
            <Copy className="invisible" size={16} />
          ) : (
            <button
              className="hover:text-yellow-500 p-1 hover:bg-muted rounded-sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                navigator.clipboard.writeText(node.path);
              }}
            >
              <Copy size={16} />
              <span className="sr-only">Copy file URL</span>
            </button>
          )}

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
      </Comp>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((childNode, index) => (
            <TreeNode
              key={`${childNode.name}-${index}`}
              node={childNode}
              level={level + 1}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Files() {
  const { data: files, isLoading } = useGetFilesQuery();
  const [trigger] = useDeleteFileMutation();

  if (!files || isLoading) return null;

  return files
    .toSorted((a) => (a.type === 'directory' ? -1 : 1))
    .map((file) => <TreeNode key={file.name} node={file} onDelete={trigger} />);
}
