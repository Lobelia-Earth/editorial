'use client';

import { useGetFilesQuery } from '@/lib/store/editorialApi';
import { cn } from '@/lib/utils';
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

const TreeNode = ({ node, level = 0 }) => {
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
        className={`flex items-center py-1 px-2 group hover:bg-gray-100 rounded-md cursor-pointer`}
        style={{ marginLeft: `${level * 20}px` }}
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

        <div className="flex items-center gap-2 ml-2">
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-yellow-500" />
            ) : (
              <Folder size={16} className="text-yellow-500" />
            )
          ) : (
            <File size={16} className=" text-gray-500" />
          )}
          <span className="text-sm">{node.name}</span>
        </div>

        <div className="flex items-center gap-1 group-hover:visible invisible ml-auto">
          <Copy size={14} />
          <Trash size={14} />
          <Ellipsis size={14} />
        </div>
      </Comp>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((childNode, index) => (
            <TreeNode
              key={`${childNode.name}-${index}`}
              node={childNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Files() {
  const { data: files } = useGetFilesQuery();

  return (
    <>
      {files
        ?.toSorted((a) => (a.type === 'directory' ? -1 : 1))
        .map((file) => <TreeNode key={file.name} node={file} />)}
    </>
  );
}
