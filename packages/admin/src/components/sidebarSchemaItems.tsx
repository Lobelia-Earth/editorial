'use client';

import {
  useGetDataQuery,
  useGetSchemaQuery,
} from '@/lib/store/slices/editorialApi';
import Link from 'next/link';
import { SidebarMenuSub, SidebarMenuSubButton } from './ui/sidebar';

export interface SidebarSchemaItemsProps {
  href: string;
  singleton?: boolean;
}

export default function SidebarSchemaItems({
  href,
  singleton,
}: SidebarSchemaItemsProps) {
  const { data: schema } = useGetSchemaQuery();
  const { data } = useGetDataQuery();

  if (!schema) return null;

  return (
    <>
      {Object.entries(schema)
        .filter(([, value]) => (singleton ? value.singleton : !value.singleton))
        .map(([key, value]) => {
          return (
            <SidebarMenuSub key={value.displayName}>
              <SidebarMenuSubButton asChild>
                <Link href={`${href}/${key}`}>
                  <span className="inline-block overflow-hidden whitespace-nowrap text-ellipsis text-nowrap w-full">
                    {value.displayName}
                  </span>

                  {!singleton && data && (
                    <span className="text-xs text-gray-500 ml-auto pr-1">
                      {Object.keys(data[key]).length}
                    </span>
                  )}
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSub>
          );
        })}
    </>
  );
}
