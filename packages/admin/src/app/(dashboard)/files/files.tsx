'use client';

import {
  useDeleteFileMutation,
  useGetFilesQuery,
} from '@/lib/store/editorialApi';
import { cn, formatFileSize } from '@/lib/utils';
import type { EditorialFiles } from '@isardsat/editorial-common';
import {
  ChevronDown,
  Copy,
  Ellipsis,
  File,
  Folder,
  FolderOpen,
  Trash,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export interface TreeNodeProps {
  node: EditorialFiles[number];
  level?: number;
  onDelete: (path: string) => void;
}
const TreeNode = ({ node, level = 0, onDelete }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
        className={`flex items-center gap-2 py-1 px-2 group hover:bg-gray-100 cursor-pointer`}
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
            <File size={16} className=" text-gray-500" />
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
          <Copy
            size={14}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigator.clipboard.writeText(node.path);
            }}
          />
          <Trash
            size={14}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(node.path);
            }}
          />
          <Ellipsis size={14} className="text-gray-400" />
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
  const { data: files } = useGetFilesQuery();
  const [trigger] = useDeleteFileMutation();

  return (
    <>
      <div className={`flex items-center gap-2 py-1 px-2 border-b group`}>
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
      {files
        ?.toSorted((a) => (a.type === 'directory' ? -1 : 1))
        .map((file) => (
          <TreeNode key={file.name} node={file} onDelete={trigger} />
        ))}
    </>
  );
}
